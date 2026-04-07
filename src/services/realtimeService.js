import { API_BASE_URL } from "../lib/env";
import { getAuthToken } from "../lib/auth";
import {
  getPatientRealtimeFeed,
  normalizePatientFeedItem,
} from "./patientService";

const API_PREFIX = "/api/v1";
const DEFAULT_POLL_INTERVAL_MS = 15000;
const DEFAULT_RECONNECT_DELAY_MS = 5000;

const normalizeApiBase = (value) => {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) return API_PREFIX;

  if (/\/api\/v1$/i.test(raw)) return raw;
  if (/\/api$/i.test(raw)) return `${raw}/v1`;

  return `${raw}${API_PREFIX}`;
};

const buildRealtimeUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const prefixedPath = normalizedPath.startsWith(API_PREFIX)
    ? normalizedPath
    : `${API_PREFIX}${normalizedPath}`;

  const base = normalizeApiBase(API_BASE_URL);
  return `${base}${prefixedPath.replace(/^\/api\/v1/i, "")}`;
};

const getLatestCursor = (items = [], fallback = null) => {
  const timestamps = items
    .map((item) => item?.updated_at || item?.occurred_at || null)
    .filter(Boolean)
    .sort();

  return timestamps[timestamps.length - 1] || fallback;
};

const canUseStreamingFetch = () =>
  typeof fetch === "function" &&
  typeof AbortController !== "undefined" &&
  typeof TextDecoder !== "undefined";

const parseSseChunk = (chunk) => {
  const lines = chunk.split(/\r?\n/);
  let eventType = "message";
  const dataLines = [];

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith(":")) continue;

    const separatorIndex = line.indexOf(":");
    const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
    const value = separatorIndex >= 0 ? line.slice(separatorIndex + 1).trimStart() : "";

    if (field === "event") {
      eventType = value || "message";
      continue;
    }

    if (field === "data") {
      dataLines.push(value);
    }
  }

  if (!dataLines.length) return null;

  try {
    return {
      eventType,
      payload: JSON.parse(dataLines.join("\n")),
    };
  } catch {
    return null;
  }
};

export const subscribeToPatientFeed = async ({
  onItems,
  onError,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  reconnectDelayMs = DEFAULT_RECONNECT_DELAY_MS,
} = {}) => {
  let closed = false;
  let activeController = null;
  let pollTimer = null;
  let reconnectTimer = null;
  let latestCursor = null;

  const stopActiveRequest = () => {
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  };

  const clearTimers = () => {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const emitItems = (items) => {
    if (!Array.isArray(items) || !items.length) return;
    latestCursor = getLatestCursor(items, latestCursor);
    onItems?.(items);
  };

  const pollFeed = async () => {
    if (closed) return;

    try {
      const response = await getPatientRealtimeFeed(
        latestCursor ? { since: latestCursor } : {}
      );
      const items = Array.isArray(response?.items) ? response.items : [];
      latestCursor = response?.server_time || getLatestCursor(items, latestCursor);
      emitItems(items);
    } catch (error) {
      onError?.(error);
    } finally {
      if (!closed) {
        pollTimer = setTimeout(pollFeed, pollIntervalMs);
      }
    }
  };

  const startPolling = () => {
    clearTimers();
    stopActiveRequest();
    pollFeed();
  };

  const startStream = async () => {
    const token = await getAuthToken();
    if (!token) {
      startPolling();
      return;
    }

    activeController = new AbortController();

    try {
      const response = await fetch(buildRealtimeUrl("/patient-portal/feed/stream"), {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
        signal: activeController.signal,
      });

      if (!response.ok || !response.body || typeof response.body.getReader !== "function") {
        throw new Error(`Realtime stream unavailable (${response.status || "no-body"})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (!closed) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split(/\r?\n\r?\n/);
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const parsed = parseSseChunk(chunk);
          if (!parsed) continue;
          if (parsed.eventType !== "patient.feed.updated") continue;

          const item = normalizePatientFeedItem(parsed.payload?.data || parsed.payload);
          emitItems([item]);
        }
      }

      if (!closed) {
        reconnectTimer = setTimeout(startStream, reconnectDelayMs);
      }
    } catch (error) {
      if (!closed && error?.name !== "AbortError") {
        onError?.(error);
        reconnectTimer = setTimeout(startPolling, reconnectDelayMs);
      }
    }
  };

  if (canUseStreamingFetch()) {
    startStream();
  } else {
    startPolling();
  }

  return () => {
    closed = true;
    clearTimers();
    stopActiveRequest();
  };
};

export const getRealtimeState = () => ({
  subscribed: true,
});
