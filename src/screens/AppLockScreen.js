/**
 * AppLockScreen — W2-MOB-005
 *
 * Two modes controlled by AppLockContext state:
 *
 *   SETUP mode  (hasPinSet === false)
 *     "Create a 4-digit PIN" — enter and save PIN in one step
 *
 *   UNLOCK mode (hasPinSet === true && isLocked === true)
 *     "Enter your PIN" + optional biometric button
 *     Shows shake animation + error message on wrong PIN
 *     Biometric prompt fires automatically on mount if available
 *
 * No navigation props needed — the screen is rendered directly by AppNavigator
 * when isLocked || !hasPinSet, bypassing React Navigation entirely.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppLock } from '../context/AppLockContext';
import { colors } from '../theme/tokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_LENGTH = 4;
const TEAL       = colors.primary;
const TEAL_DARK  = colors.primaryDark;
const ERROR_RED  = '#dc2626';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppLockScreen() {
  const {
    hasPinSet,
    biometricsAvailable,
    failedAttempts,
    setPin,
    unlock,
    unlockWithBiometrics,
  } = useAppLock();

  // Shared input state
  const [input, setInput]   = useState('');
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  // Shake animation on wrong PIN
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const isSetupMode = !hasPinSet;

  // ── Auto-trigger biometrics on unlock mount ──────────────────────────────
  useEffect(() => {
    if (!isSetupMode && biometricsAvailable) {
      // Small delay so the screen renders first
      const t = setTimeout(() => tryBiometrics(), 400);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shake animation ───────────────────────────────────────────────────────
  const triggerShake = () => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Keypad press handler ──────────────────────────────────────────────────
  const handleKey = async (key) => {
    if (success) return;

    if (key === 'del') {
      setInput((prev) => prev.slice(0, -1));
      setError('');
      return;
    }

    const next = input + key;
    setInput(next);
    setError('');

    if (next.length < PIN_LENGTH) return;

    // Full PIN entered — process
    if (isSetupMode) {
      await handleSetupInput(next);
    } else {
      await handleUnlockInput(next);
    }
  };

  // ── Setup flow ────────────────────────────────────────────────────────────
  const handleSetupInput = async (pin) => {
    setSuccess(true);
    await setPin(pin);
    // AppNavigator will re-render (hasPinSet becomes true, isLocked false)
  };

  // ── Unlock flow ───────────────────────────────────────────────────────────
  const handleUnlockInput = async (pin) => {
    const ok = await unlock(pin);
    if (!ok) {
      triggerShake();
      const tries = failedAttempts + 1;
      setError(`Incorrect PIN${tries >= 3 ? ` (${tries} attempts)` : ''}`);
      setInput('');
    }
    // On success: AppLockContext sets isLocked = false → AppNavigator re-renders
  };

  const tryBiometrics = async () => {
    await unlockWithBiometrics();
  };

  // ── Labels ────────────────────────────────────────────────────────────────
  const title = isSetupMode ? 'Create a PIN' : 'Enter your PIN';

  const subtitle = isSetupMode
    ? 'Set a 4-digit PIN to protect patient data'
    : 'Required to access patient records';

  // ── Dots ──────────────────────────────────────────────────────────────────
  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => ({
    filled: i < input.length,
    key: i,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Feather name="shield" size={32} color="#fff" />
        </View>
        <Text style={styles.appName}>LINK</Text>
        <Text style={styles.appTagline}>Health Information System</Text>
      </View>

      {/* PIN dots */}
      <Animated.View
        style={[styles.dotsSection, { transform: [{ translateX: shakeAnim }] }]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.dots}>
          {dots.map((d) => (
            <View
              key={d.key}
              style={[styles.dot, d.filled && styles.dotFilled]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Animated.View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, ri) => (
          <View key={ri} style={styles.keypadRow}>
            {row.map((key, ki) => {
              if (key === '') return <View key={ki} style={styles.keyEmpty} />;

              const isDel = key === 'del';
              return (
                <TouchableOpacity
                  key={ki}
                  style={[styles.keyBtn, isDel && styles.keyBtnDel]}
                  onPress={() => handleKey(key)}
                  activeOpacity={0.7}
                >
                  {isDel ? (
                    <Feather name="delete" size={22} color="#374151" />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Biometric button */}
      {!isSetupMode && biometricsAvailable && (
        <TouchableOpacity
          style={styles.biometricBtn}
          onPress={tryBiometrics}
          activeOpacity={0.7}
        >
          <Feather name="aperture" size={20} color={TEAL} />
          <Text style={styles.biometricText}>Use biometrics</Text>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 8,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
  },
  appTagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Dots section
  dotsSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 28,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  dots: {
    flexDirection: 'row',
    gap: 16,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  errorText: {
    marginTop: 16,
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Keypad
  keypad: {
    width: '80%',
    maxWidth: 320,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keyBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnDel: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  keyEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '500',
    color: '#fff',
  },

  // Biometric
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEAL,
  },

});
