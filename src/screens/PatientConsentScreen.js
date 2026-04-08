import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import Screen from "../components/ui/Screen";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import HeroHeader from "../components/ui/HeroHeader";
import { colors, spacing, radius, typography, shadow } from "../theme/tokens";
import { patientPortalPalette } from "../theme/patientPortal";
import {
  getFacilities,
  getActiveConsents,
  grantConsent,
  revokeConsent,
  getConsentHistory,
  getRecordAccessRequests,
  approveRecordAccessRequest,
  declineRecordAccessRequest,
} from "../services/patientService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// ── Localization ──────────────────────────────────────────────────────────
const LOCALE = {
  en: {
    grantTab: "Grant",
    revokeTab: "Revoke",
    historyTab: "History",
    grantTitle: "Grant Consent",
    grantDesc: "Allow a facility to access your medical records",
    facility: "Facility",
    selectFacility: "Select a facility",
    consentScope: "Consent Scope",
    recordsAccess: "Medical Records Access",
    providerTarget: "Provider Target",
    facilityCareTeam: "Facility Care Team",
    specificProvider: "Specific Provider",
    providerName: "Provider Name",
    purpose: "Purpose (Optional)",
    purposePlaceholder: "Why are you granting this consent?",
    comprehension: "Comprehension Attestation",
    comprehensionPlaceholder: "In your own words, explain what you understand about sharing your records...",
    comprehensionMin: "Minimum 20 characters required",
    comprehensionLang: "Comprehension Language",
    confirmCheck: "I understand and confirm this consent",
    submit: "Grant Consent",
    revokeTitle: "Revoke Consent",
    revokeDesc: "Withdraw a previously granted consent",
    revokeReason: "Reason for Revocation",
    revokeReasonPlaceholder: "Why do you want to revoke this consent?",
    confirmPhrase: 'Type "REVOKE" to confirm',
    revokeBtn: "Revoke Consent",
    historyTitle: "Consent History",
    historyDesc: "A record of all consent actions",
    granted: "Granted",
    revoked: "Revoked",
    noHistory: "No consent history yet",
    noConsents: "No active consents to revoke",
    highRiskWarning: "High-Risk Warnings Detected",
    lowComprehension: "Comprehension text may be too short (< 80 characters)",
    languageMismatch: "Comprehension language differs from app language",
    overrideRequired: "Override documentation required",
    overrideReason: "Override Reason",
  },
  am: {
    grantTab: "ስጥ",
    revokeTab: "ሰርዝ",
    historyTab: "ታሪክ",
    grantTitle: "ፈቃድ ስጥ",
    grantDesc: "ተቋም የሕክምና መዝገብዎን እንዲያገኝ ይፍቀዱ",
    facility: "ተቋም",
    selectFacility: "ተቋም ይምረጡ",
    consentScope: "የፈቃድ ወሰን",
    recordsAccess: "የሕክምና መዝገብ ማግኘት",
    providerTarget: "አቅራቢ ዒላማ",
    facilityCareTeam: "የተቋም እንክብካቤ ቡድን",
    specificProvider: "ልዩ አቅራቢ",
    providerName: "የአቅራቢ ስም",
    purpose: "ዓላማ (አማራጭ)",
    purposePlaceholder: "ይህን ፈቃድ ለምን እየሰጡ ነው?",
    comprehension: "የግንዛቤ ማረጋገጫ",
    comprehensionPlaceholder: "መዝገቦችዎን ስለማጋራት የሚረዱትን በራስዎ ቃላት ያብራሩ...",
    comprehensionMin: "ቢያንስ 20 ቁምፊ ያስፈልጋል",
    comprehensionLang: "የግንዛቤ ቋንቋ",
    confirmCheck: "ይህን ፈቃድ ተረድቼ አረጋግጣለሁ",
    submit: "ፈቃድ ስጥ",
    revokeTitle: "ፈቃድ ሰርዝ",
    revokeDesc: "ቀደም ሲል የተሰጠ ፈቃድ ያስወግዱ",
    revokeReason: "የመሰረዝ ምክንያት",
    revokeReasonPlaceholder: "ይህን ፈቃድ ለምን መሰረዝ ይፈልጋሉ?",
    confirmPhrase: 'ለማረጋገጥ "REVOKE" ይተይቡ',
    revokeBtn: "ፈቃድ ሰርዝ",
    historyTitle: "የፈቃድ ታሪክ",
    historyDesc: "የሁሉም ፈቃድ እርምጃዎች መዝገብ",
    granted: "ተሰጥቷል",
    revoked: "ተሰርዟል",
    noHistory: "ገና የፈቃድ ታሪክ የለም",
    noConsents: "ለመሰረዝ ንቁ ፈቃዶች የሉም",
    highRiskWarning: "ከፍተኛ-ስጋት ማስጠንቀቂያዎች ተገኝተዋል",
    lowComprehension: "የግንዛቤ ጽሑፍ በጣም አጭር ሊሆን ይችላል (< 80 ቁምፊዎች)",
    languageMismatch: "የግንዛቤ ቋንቋ ከመተግበሪያ ቋንቋ ይለያል",
    overrideRequired: "የውሳኔ ሰነድ ያስፈልጋል",
    overrideReason: "የውሳኔ ምክንያት",
  },
};

const TABS = ["requests", "grant", "revoke", "history"];
const TAB_LABEL_FALLBACK = {
  requests: "Requests",
  grant: "Grant",
  revoke: "Revoke",
  history: "History",
};

const PatientConsentScreen = () => {
  const [lang, setLang] = useState("en");
  const t = LOCALE[lang];
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("requests");
  const [facilities, setFacilities] = useState([]);
  const [activeConsents, setActiveConsents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Grant form state
  const [grantFacility, setGrantFacility] = useState("");
  const [providerTargetType, setProviderTargetType] = useState("facility_care_team");
  const [providerTargetName, setProviderTargetName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [comprehensionText, setComprehensionText] = useState("");
  const [comprehensionLang, setComprehensionLang] = useState("en");
  const [confirmed, setConfirmed] = useState(false);
  const [showGrantFacilityPicker, setShowGrantFacilityPicker] = useState(false);
  const [highRiskOverride, setHighRiskOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  // Revoke state
  const [revokeReasonText, setRevokeReasonText] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [facRes, activeRes, histRes, requestRes] = await Promise.all([
        getFacilities(),
        getActiveConsents(),
        getConsentHistory(),
        getRecordAccessRequests({
          patientId: user?.patient_id || user?.id,
          status: "pending",
        }),
      ]);
      setFacilities(facRes.facilities || []);
      setActiveConsents(activeRes.active_consents || []);
      setHistory(histRes.history || []);
      setRequests(requestRes.requests || []);
    } catch (err) {
      console.error("Failed to load consent data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.patient_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // High-risk detection
  const warnings = [];
  if (comprehensionText.length > 0 && comprehensionText.length < 80) warnings.push("lowComprehension");
  if (comprehensionLang !== lang) warnings.push("languageMismatch");

  const resetGrantForm = () => {
    setGrantFacility("");
    setProviderTargetType("facility_care_team");
    setProviderTargetName("");
    setPurpose("");
    setComprehensionText("");
    setComprehensionLang("en");
    setConfirmed(false);
    setHighRiskOverride(false);
    setOverrideReason("");
  };

  const handleGrant = async () => {
    if (!grantFacility) { Alert.alert("Error", t.selectFacility); return; }
    if (comprehensionText.length < 20) { Alert.alert("Error", t.comprehensionMin); return; }
    if (!confirmed) { Alert.alert("Error", t.confirmCheck); return; }
    if (warnings.length > 0 && !highRiskOverride) {
      Alert.alert(t.highRiskWarning, t.overrideRequired);
      return;
    }

    setSubmitting(true);
    try {
      await grantConsent({
        facility_id: grantFacility,
        scope: "shared_medical_history",
        comprehension_text: comprehensionText,
        comprehension_language: comprehensionLang,
        ui_language: lang,
        purpose: purpose.trim() || undefined,
        high_risk_override: warnings.length > 0 ? true : undefined,
        override_reason: overrideReason.trim() || undefined,
        provider_target_type: providerTargetType,
        provider_target_name: providerTargetType === "specific_provider" ? providerTargetName.trim() : undefined,
      });
      showToast(lang === "en" ? "Consent granted successfully" : "ፈቃድ በተሳካ ሁኔታ ተሰጥቷል", "success");
      resetGrantForm();
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Failed to grant consent.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (consent) => {
    setSubmitting(true);
    try {
      await revokeConsent({
        consent_id: consent.id,
        facility_id: consent.facility_id,
        scope: consent.scope || "shared_medical_history",
        reason: revokeReasonText.trim() || undefined,
      });
      showToast(lang === "en" ? "Consent revoked" : "ፈቃድ ተሰርዟል", "success");
      setRevokeReasonText("");
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Failed to revoke consent.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async (request) => {
    if (!request?.id) return;
    setSubmitting(true);
    try {
      await approveRecordAccessRequest(request.id, {
        approved_by_patient_id: request.patient_id || user?.patient_id || user?.id,
        approved_scope: request.scope || "shared_medical_history",
      });
      showToast("Access request approved", "success");
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Failed to approve request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineRequest = async (request) => {
    if (!request?.id) return;
    setSubmitting(true);
    try {
      await declineRecordAccessRequest(request.id, {});
      showToast("Access request declined", "success");
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Failed to decline request.");
    } finally {
      setSubmitting(false);
    }
  };

  const grantFacilityName = facilities.find((f) => f.id === grantFacility)?.name || t.selectFacility;

  if (loading) {
    return (
      <Screen backgroundColor={palette.white} style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.darkPurple} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={palette.white} style={styles.screen}>
      {/* Language toggle */}
      <View style={styles.langRow}>
        <Pressable
          style={[styles.langChip, lang === "en" && styles.langChipActive]}
          onPress={() => setLang("en")}
        >
          <Text style={[styles.langText, lang === "en" && styles.langTextActive]}>English</Text>
        </Pressable>
        <Pressable
          style={[styles.langChip, lang === "am" && styles.langChipActive]}
          onPress={() => setLang("am")}
        >
          <Text style={[styles.langText, lang === "am" && styles.langTextActive]}>አማርኛ</Text>
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {t[`${tab}Tab`] || TAB_LABEL_FALLBACK[tab] || tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.darkPurple} />}
      >
        <HeroHeader
          badge="Privacy control"
          title="Consent Manager"
          subtitle="Choose who can view your records, revoke access clearly, and review every consent action in one place."
          style={styles.heroBlock}
        />
        {/* ── GRANT TAB ──────────────────────────────────────────────── */}
        {activeTab === "requests" && (
          <View style={styles.panel}>
            <Text style={styles.heading}>Access Requests</Text>
            <Text style={styles.subtitle}>
              Review facility requests to view your shared medical history and approve only the ones you trust.
            </Text>

            {requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No pending access requests</Text>
              </View>
            ) : (
              requests.map((request) => (
                <Card key={request.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.actionBadge, styles.grantBadge]}>
                      <Text style={[styles.actionBadgeText, styles.grantBadgeText]}>Pending</Text>
                    </View>
                    {!!request.created_at && (
                      <Text style={styles.historyDate}>
                        {new Date(request.created_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.historyFacility}>{request.requesting_facility_name}</Text>
                  <Text style={styles.historyType}>
                    {request.scope === "shared_medical_history"
                      ? "Shared medical history"
                      : request.scope || "Shared medical history"}
                  </Text>
                  {!!request.source_facility_name && (
                    <Text style={styles.historyMeta}>Source: {request.source_facility_name}</Text>
                  )}
                  {!!request.purpose && (
                    <Text style={styles.historyMeta}>Purpose: {request.purpose}</Text>
                  )}
                  {!!request.reason && (
                    <Text style={styles.historyMeta}>Reason: {request.reason}</Text>
                  )}
                  <View style={styles.requestActionsRow}>
                    <Button
                      title={submitting ? "..." : "Decline"}
                      onPress={() => handleDeclineRequest(request)}
                      style={[styles.requestActionBtn, styles.declineBtn]}
                    />
                    <Button
                      title={submitting ? "..." : "Approve"}
                      onPress={() => handleApproveRequest(request)}
                      style={[styles.requestActionBtn, styles.approveBtn]}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
        {activeTab === "grant" && (
          <View style={styles.panel}>
            <Text style={styles.heading}>{t.grantTitle}</Text>
            <Text style={styles.subtitle}>{t.grantDesc}</Text>

            {/* Facility */}
            <Text style={styles.fieldLabel}>{t.facility} *</Text>
            <Pressable style={styles.pickerButton} onPress={() => setShowGrantFacilityPicker(!showGrantFacilityPicker)}>
              <Text style={grantFacility ? styles.pickerText : styles.pickerPlaceholder}>{grantFacilityName}</Text>
            </Pressable>
            {showGrantFacilityPicker && (
              <View style={styles.pickerDropdown}>
                {facilities.map((fac) => (
                  <Pressable
                    key={fac.id}
                    style={[styles.pickerOption, grantFacility === fac.id && styles.pickerOptionSelected]}
                    onPress={() => { setGrantFacility(fac.id); setShowGrantFacilityPicker(false); }}
                  >
                    <Text style={styles.pickerOptionText}>{fac.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Consent scope */}
            <Text style={styles.fieldLabel}>{t.consentScope}</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{t.recordsAccess}</Text>
            </View>

            {/* Provider target */}
            <Text style={styles.fieldLabel}>{t.providerTarget}</Text>
            <View style={styles.radioGroup}>
              <Pressable
                style={[styles.radioOption, providerTargetType === "facility_care_team" && styles.radioSelected]}
                onPress={() => setProviderTargetType("facility_care_team")}
              >
                <Text style={[styles.radioText, providerTargetType === "facility_care_team" && styles.radioTextSelected]}>
                  {t.facilityCareTeam}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.radioOption, providerTargetType === "specific_provider" && styles.radioSelected]}
                onPress={() => setProviderTargetType("specific_provider")}
              >
                <Text style={[styles.radioText, providerTargetType === "specific_provider" && styles.radioTextSelected]}>
                  {t.specificProvider}
                </Text>
              </Pressable>
            </View>

            {providerTargetType === "specific_provider" && (
              <>
                <Text style={styles.fieldLabel}>{t.providerName}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t.providerName}
                  value={providerTargetName}
                  onChangeText={setProviderTargetName}
                  placeholderTextColor="#9CA3AF"
                />
              </>
            )}

            {/* Purpose */}
            <Text style={styles.fieldLabel}>{t.purpose}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.purposePlaceholder}
              value={purpose}
              onChangeText={setPurpose}
              placeholderTextColor="#9CA3AF"
            />

            {/* Comprehension */}
            <Text style={styles.fieldLabel}>{t.comprehension} *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t.comprehensionPlaceholder}
              value={comprehensionText}
              onChangeText={setComprehensionText}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
            {comprehensionText.length > 0 && comprehensionText.length < 20 && (
              <Text style={styles.errorText}>{t.comprehensionMin}</Text>
            )}

            {/* Comprehension language */}
            <Text style={styles.fieldLabel}>{t.comprehensionLang}</Text>
            <View style={styles.radioGroup}>
              <Pressable
                style={[styles.radioOption, comprehensionLang === "en" && styles.radioSelected]}
                onPress={() => setComprehensionLang("en")}
              >
                <Text style={[styles.radioText, comprehensionLang === "en" && styles.radioTextSelected]}>English</Text>
              </Pressable>
              <Pressable
                style={[styles.radioOption, comprehensionLang === "am" && styles.radioSelected]}
                onPress={() => setComprehensionLang("am")}
              >
                <Text style={[styles.radioText, comprehensionLang === "am" && styles.radioTextSelected]}>አማርኛ</Text>
              </Pressable>
            </View>

            {/* High-risk warnings */}
            {warnings.length > 0 && (
              <Card style={styles.warningCard}>
                <Text style={styles.warningTitle}>{t.highRiskWarning}</Text>
                {warnings.includes("lowComprehension") && (
                  <Text style={styles.warningText}>{t.lowComprehension}</Text>
                )}
                {warnings.includes("languageMismatch") && (
                  <Text style={styles.warningText}>{t.languageMismatch}</Text>
                )}
                <View style={styles.overrideRow}>
                  <Text style={styles.overrideLabel}>{t.overrideRequired}</Text>
                  <Switch
                    value={highRiskOverride}
                    onValueChange={setHighRiskOverride}
                    trackColor={{ true: palette.darkPurple }}
                  />
                </View>
                {highRiskOverride && (
                  <>
                    <Text style={styles.fieldLabel}>{t.overrideReason}</Text>
                    <TextInput
                      style={styles.input}
                      value={overrideReason}
                      onChangeText={setOverrideReason}
                      placeholderTextColor="#9CA3AF"
                    />
                  </>
                )}
              </Card>
            )}

            {/* Confirmation */}
            <Pressable style={styles.checkRow} onPress={() => setConfirmed(!confirmed)}>
              <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
                {confirmed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>{t.confirmCheck}</Text>
            </Pressable>

            <Button
              title={submitting ? "..." : t.submit}
              onPress={handleGrant}
              style={styles.submitBtn}
            />
          </View>
        )}

        {/* ── REVOKE TAB ─────────────────────────────────────────────── */}
        {activeTab === "revoke" && (
          <View style={styles.panel}>
            <Text style={styles.heading}>{t.revokeTitle}</Text>
            <Text style={styles.subtitle}>{t.revokeDesc}</Text>

            {/* Reason */}
            <Text style={styles.fieldLabel}>{t.revokeReason}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t.revokeReasonPlaceholder}
              value={revokeReasonText}
              onChangeText={setRevokeReasonText}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />

            {activeConsents.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{t.noConsents}</Text>
              </View>
            ) : (
              activeConsents.map((consent) => (
                <Card key={consent.id || consent.facility_id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.actionBadge, styles.grantBadge]}>
                      <Text style={[styles.actionBadgeText, styles.grantBadgeText]}>Active</Text>
                    </View>
                    {!!consent.created_at && (
                      <Text style={styles.historyDate}>
                        {new Date(consent.created_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.historyFacility}>{consent.facility_name}</Text>
                  <Text style={styles.historyType}>
                    {consent.scope === "shared_medical_history" ? "Shared medical history" : (consent.scope || "Shared medical history")}
                  </Text>
                  {!!consent.provider_target_name && (
                    <Text style={styles.historyMeta}>{consent.provider_target_name}</Text>
                  )}
                  {!!consent.purpose && (
                    <Text style={styles.historyMeta}>{consent.purpose}</Text>
                  )}
                  <Button
                    title={submitting ? "..." : t.revokeBtn}
                    onPress={() => handleRevoke(consent)}
                    style={[styles.submitBtn, styles.revokeActionBtn]}
                  />
                </Card>
              ))
            )}
          </View>
        )}

        {/* ── HISTORY TAB ────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <View style={styles.panel}>
            <Text style={styles.heading}>{t.historyTitle}</Text>
            <Text style={styles.subtitle}>{t.historyDesc}</Text>

            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{t.noHistory}</Text>
              </View>
            ) : (
              history.map((entry) => {
                const action = String(entry.action || "").toLowerCase();
                const status = String(entry.status || "").toLowerCase();
                const isRevoked =
                  action === "revoke" ||
                  action === "revoked" ||
                  status === "revoked" ||
                  status === "inactive" ||
                  status === "withdrawn" ||
                  Boolean(entry.revoked_at) ||
                  (Boolean(entry.reason) && action !== "grant");
                const isGrant = !isRevoked;
                return (
                  <Card key={entry.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.actionBadge, isGrant ? styles.grantBadge : styles.revokeBadge]}>
                        <Text style={[styles.actionBadgeText, isGrant ? styles.grantBadgeText : styles.revokeBadgeText]}>
                          {isGrant ? t.granted : t.revoked}
                        </Text>
                      </View>
                      <Text style={styles.historyDate}>
                        {new Date(entry.revoked_at || entry.created_at || entry.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.historyFacility}>{entry.facility_name || entry.facilityName}</Text>
                    <Text style={styles.historyType}>
                      {(entry.scope || entry.consentType) === "shared_medical_history" ? "Shared medical history" : (entry.scope || entry.consentType || "Shared medical history")}
                    </Text>
                    {entry.metadata?.comprehensionLanguage && (
                      <Text style={styles.historyMeta}>
                        Language: {entry.metadata.comprehensionLanguage === "am" ? "አማርኛ" : "English"}
                      </Text>
                    )}
                    {entry.reason && (
                      <Text style={styles.historyMeta}>Reason: {entry.reason}</Text>
                    )}
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const palette = {
  darkPurple: patientPortalPalette.primaryContainer,
  lightPurple: patientPortalPalette.primaryFixed,
  green: patientPortalPalette.secondaryFixed,
  black: patientPortalPalette.text,
  white: patientPortalPalette.surface,
  softWhite: patientPortalPalette.background,
};

const styles = StyleSheet.create({
  screen: { padding: 0 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  heroBlock: { marginBottom: spacing.lg },
  panel: {
    backgroundColor: palette.white,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#E0E6EA",
    marginBottom: spacing.md,
    ...shadow.card,
  },

  langRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  langChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E0E6",
    backgroundColor: palette.softWhite,
  },
  langChipActive: { backgroundColor: palette.darkPurple, borderColor: palette.darkPurple },
  langText: { fontSize: 13, color: palette.black, fontWeight: "600" },
  langTextActive: { color: palette.white, fontWeight: "600" },

  tabBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: palette.softWhite,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D6E0E6",
  },
  tabActive: { backgroundColor: palette.darkPurple, borderColor: palette.darkPurple },
  tabText: { fontSize: 14, fontWeight: "700", color: palette.black },
  tabTextActive: { color: palette.white },

  heading: { fontSize: 22, fontWeight: "800", color: palette.black, marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#566772", marginBottom: spacing.lg, lineHeight: 21 },

  fieldLabel: { fontSize: 13, fontWeight: "700", color: palette.black, marginBottom: 8, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: "#D6E0E6",
    borderRadius: 16,
    padding: spacing.md,
    fontSize: 14,
    color: palette.black,
    backgroundColor: palette.softWhite,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  errorText: { fontSize: 12, color: "#B91C1C", marginTop: 4 },

  pickerButton: {
    borderWidth: 1,
    borderColor: "#D6E0E6",
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: palette.softWhite,
  },
  pickerText: { fontSize: 14, color: palette.black },
  pickerPlaceholder: { fontSize: 14, color: "#9CA3AF" },
  pickerDropdown: {
    borderWidth: 1,
    borderColor: "#D6E0E6",
    borderRadius: 18,
    backgroundColor: palette.white,
    marginTop: 4,
  },
  pickerOption: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: "#E3E8EB" },
  pickerOptionSelected: { backgroundColor: palette.lightPurple },
  pickerOptionText: { fontSize: 14, color: palette.black },

  readOnlyField: {
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: palette.softWhite,
    borderWidth: 1,
    borderColor: "#D6E0E6",
  },
  readOnlyText: { fontSize: 14, color: palette.black, opacity: 0.7 },

  radioGroup: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  radioOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E0E6",
    backgroundColor: palette.softWhite,
  },
  radioSelected: { backgroundColor: palette.darkPurple, borderColor: palette.darkPurple },
  radioText: { fontSize: 13, color: palette.black, fontWeight: "600" },
  radioTextSelected: { color: palette.white, fontWeight: "600" },

  warningCard: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    marginTop: spacing.md,
    padding: spacing.md,
  },
  warningTitle: { fontSize: 14, fontWeight: "700", color: "#92400E", marginBottom: 8 },
  warningText: { fontSize: 13, color: "#92400E", marginBottom: 4 },
  overrideRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  overrideLabel: { fontSize: 13, fontWeight: "600", color: "#92400E" },

  checkRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg, gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD8E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: palette.darkPurple, borderColor: palette.darkPurple },
  checkmark: { color: palette.white, fontSize: 14, fontWeight: "700" },
  checkLabel: { fontSize: 14, color: palette.black, flex: 1 },

  submitBtn: { marginTop: spacing.lg },
  revokeActionBtn: { backgroundColor: "#B91C1C" },
  requestActionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  requestActionBtn: { flex: 1, marginTop: 0 },
  declineBtn: { backgroundColor: "#B91C1C" },
  approveBtn: { backgroundColor: palette.darkPurple },

  emptyState: { alignItems: "center", paddingVertical: spacing.xl * 2 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: palette.black, opacity: 0.5 },

  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E6EA",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  actionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  actionBadgeText: { fontSize: 11, fontWeight: "700" },
  grantBadge: { backgroundColor: "#D1FAE5" },
  grantBadgeText: { color: "#065F46" },
  revokeBadge: { backgroundColor: "#FEE2E2" },
  revokeBadgeText: { color: "#991B1B" },
  historyDate: { fontSize: 12, color: palette.black, opacity: 0.5 },
  historyFacility: { fontSize: 15, fontWeight: "700", color: palette.black, marginBottom: 2 },
  historyType: { fontSize: 13, color: palette.black, opacity: 0.7, marginBottom: 4 },
  historyMeta: { fontSize: 12, color: palette.black, opacity: 0.5 },
});

export default PatientConsentScreen;
