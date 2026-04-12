import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { BrandMark } from '../components/brand-mark';
import { PrimaryButton } from '../components/primary-button';
import { TextField } from '../components/text-field';
import { colors } from '../theme/colors';
import type { AuthActionResult, GoogleLoginPayload } from '../types/auth';

WebBrowser.maybeCompleteAuthSession();

type FormValues = {
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

type LoginScreenProps = {
  initialEmail?: string;
  notice?: string;
  onLogin: (credentials: { email: string; password: string }) => Promise<AuthActionResult>;
  onGoogleLogin: (payload: GoogleLoginPayload) => Promise<AuthActionResult>;
  onOpenRegister: () => void;
  onOpenRecovery: () => void;
};

const initialValues: FormValues = {
  email: '',
  password: '',
};

const benefits = ['Бонуси', 'Замовлення', 'Обране'];

function readGoogleClientId(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const normalizedValue = value.trim();

  if (
    !normalizedValue ||
    normalizedValue.startsWith('your-') ||
    normalizedValue.startsWith('missing-')
  ) {
    return fallback;
  }

  return normalizedValue;
}

const googleClientIds = {
  webClientId: readGoogleClientId(
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    'missing-google-web-client-id'
  ),
  iosClientId: readGoogleClientId(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    'missing-google-ios-client-id'
  ),
  androidClientId: readGoogleClientId(
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    'missing-google-android-client-id'
  ),
};

function getMissingGoogleClientMessage() {
  if (Platform.OS === 'ios') {
    return 'Додайте EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID для входу через Google.';
  }

  if (Platform.OS === 'android') {
    return 'Додайте EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID для входу через Google.';
  }

  return 'Додайте EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID для входу через Google.';
}

export function LoginScreen({
  initialEmail = '',
  notice = '',
  onLogin,
  onGoogleLogin,
  onOpenRegister,
  onOpenRecovery,
}: LoginScreenProps) {
  const [values, setValues] = useState<FormValues>({
    ...initialValues,
    email: initialEmail,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'error'>('neutral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroShift = useRef(new Animated.Value(18)).current;

  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ scheme: 'rozetka', path: 'oauthredirect' }),
    []
  );
  const isExpoGoNative =
    Platform.OS !== 'web' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const hasPlatformGoogleClientId =
    Platform.OS === 'ios'
      ? googleClientIds.iosClientId !== 'missing-google-ios-client-id'
      : Platform.OS === 'android'
        ? googleClientIds.androidClientId !== 'missing-google-android-client-id'
        : googleClientIds.webClientId !== 'missing-google-web-client-id';

  const [googleRequest, googleResponse, promptGoogleAuth] = Google.useAuthRequest({
    ...googleClientIds,
    redirectUri,
    selectAccount: true,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(heroShift, {
        toValue: 0,
        damping: 17,
        stiffness: 135,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroShift]);

  useEffect(() => {
    setValues((current) => ({
      ...current,
      email: current.email || initialEmail,
    }));
  }, [initialEmail]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    setMessageTone('neutral');
    setMessage(notice);
  }, [notice]);

  useEffect(() => {
    const handleGoogleAuthSuccess = async () => {
      if (googleResponse?.type !== 'success') {
        if (googleResponse?.type === 'error') {
          setMessageTone('error');
          setMessage('Google-вхід завершився помилкою. Спробуйте ще раз.');
        }

        return;
      }

      const accessToken =
        googleResponse.authentication?.accessToken ?? googleResponse.params.access_token;

      if (!accessToken) {
        setMessageTone('error');
        setMessage('Google не повернув токен доступу. Спробуйте ще раз.');
        return;
      }

      setIsGoogleSubmitting(true);

      try {
        const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('GOOGLE_USERINFO_FAILED');
        }

        const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

        if (!userInfo.email || userInfo.email_verified === false) {
          setMessageTone('error');
          setMessage('Google не підтвердив email цього акаунта. Оберіть інший профіль.');
          return;
        }

        const result = await onGoogleLogin({
          email: userInfo.email.trim().toLowerCase(),
          fullName: userInfo.name?.trim() || userInfo.email.split('@')[0] || 'Користувач Google',
          avatarUrl: userInfo.picture,
          googleSubject: userInfo.sub,
        });

        if (!result.ok) {
          setMessageTone('error');
          setMessage(result.message ?? 'Не вдалося завершити Google-вхід.');
        }
      } catch {
        setMessageTone('error');
        setMessage('Не вдалося отримати профіль Google. Перевірте налаштування OAuth і спробуйте ще раз.');
      } finally {
        setIsGoogleSubmitting(false);
      }
    };

    void handleGoogleAuthSuccess();
  }, [googleResponse, onGoogleLogin]);

  const isSubmitDisabled = useMemo(() => {
    return !values.email.trim() || !values.password.trim() || isSubmitting || isGoogleSubmitting;
  }, [isGoogleSubmitting, isSubmitting, values.email, values.password]);

  const googleButtonTitle = isGoogleSubmitting
    ? 'Підключаємо Google...'
    : 'Увійти через Google';

  const googleHint = isExpoGoNative
    ? 'Для реального Google-входу потрібен development build або standalone app. У Expo Go ця кнопка слугує інтеграційною підготовкою.'
    : hasPlatformGoogleClientId
      ? 'Google OAuth налаштований на рівні застосунку. Після входу користувач потрапляє в той самий кабінет Rozetka.'
      : 'Для запуску Google-входу додайте відповідний Google Client ID у змінні середовища.';

  const handleChange = (field: keyof FormValues) => (value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    setMessage('');
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const normalizedEmail = values.email.trim().toLowerCase();
    const normalizedPassword = values.password.trim();

    if (!normalizedEmail) {
      nextErrors.email = 'Введіть email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Перевірте формат email.';
    }

    if (!normalizedPassword) {
      nextErrors.password = 'Введіть пароль.';
    } else if (normalizedPassword.length < 6) {
      nextErrors.password = 'Пароль має містити щонайменше 6 символів.';
    }

    return nextErrors;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setMessageTone('error');
      setMessage('Не вдалося виконати вхід. Перевірте поля форми.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onLogin({
        email: values.email.trim().toLowerCase(),
        password: values.password.trim(),
      });

      if (!result.ok) {
        setMessageTone('error');
        setMessage(result.message ?? 'Не вдалося виконати вхід.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGooglePress = async () => {
    setMessage('');

    if (isExpoGoNative) {
      setMessageTone('neutral');
      setMessage(
        'Google-вхід у Expo Go не працює. Щоб протестувати його, потрібен development build або standalone збірка.'
      );
      return;
    }

    if (!hasPlatformGoogleClientId) {
      setMessageTone('error');
      setMessage(getMissingGoogleClientMessage());
      return;
    }

    if (!googleRequest) {
      setMessageTone('error');
      setMessage('Google OAuth ще не ініціалізувався. Спробуйте натиснути кнопку ще раз.');
      return;
    }

    await promptGoogleAuth();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safeArea}>
        <View style={styles.background}>
          <View style={styles.topBand} />
          <View style={styles.topHalo} />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Animated.View
              style={[
                styles.headerCard,
                {
                  opacity: heroOpacity,
                  transform: [{ translateY: heroShift }],
                },
              ]}>
              <BrandMark subtitle="вхід до особистого кабінету" />

              <Text style={styles.headerTitle}>Увійдіть, щоб бачити замовлення і бонуси</Text>
              <Text style={styles.headerSubtitle}>
                Керуйте замовленнями, обраними товарами та персональними пропозиціями в одному кабінеті.
              </Text>

              <View style={styles.benefitsRow}>
                {benefits.map((item) => (
                  <View key={item} style={styles.benefitChip}>
                    <Text style={styles.benefitText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.formCard,
                {
                  opacity: heroOpacity,
                  transform: [{ translateY: heroShift }],
                },
              ]}>
              <Text style={styles.formTitle}>Вхід</Text>
              <Text style={styles.formSubtitle}>
                Вкажіть email і пароль, щоб перейти до свого профілю.
              </Text>

              <TextField
                label="Email"
                value={values.email}
                onChangeText={handleChange('email')}
                placeholder="example@gmail.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                error={errors.email}
              />

              <TextField
                label="Пароль"
                value={values.password}
                onChangeText={handleChange('password')}
                placeholder="Введіть пароль"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.password}
              />

              <PrimaryButton
                title={isSubmitting ? 'Вхід...' : 'Увійти'}
                onPress={handleSubmit}
                disabled={isSubmitDisabled}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>або</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                onPress={() => void handleGooglePress()}
                disabled={isGoogleSubmitting}
                style={({ pressed }) => [
                  styles.googleButton,
                  isGoogleSubmitting && styles.googleButtonDisabled,
                  pressed && !isGoogleSubmitting && styles.googleButtonPressed,
                ]}>
                <View style={styles.googleMark}>
                  <Text style={styles.googleMarkText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>{googleButtonTitle}</Text>
              </Pressable>

              <Text style={styles.googleHint}>{googleHint}</Text>

              <View style={styles.actionsRow}>
                <Pressable onPress={onOpenRecovery}>
                  <Text style={styles.linkText}>Забули пароль?</Text>
                </Pressable>
                <Pressable onPress={onOpenRegister}>
                  <Text style={styles.linkText}>Створити акаунт</Text>
                </Pressable>
              </View>

              {message ? (
                <View
                  style={[
                    styles.messageCard,
                    messageTone === 'error' ? styles.messageCardError : styles.messageCardNeutral,
                  ]}>
                  <Text
                    style={[
                      styles.messageText,
                      messageTone === 'error' && styles.messageTextError,
                    ]}>
                    {message}
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  background: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: colors.panelStrong,
  },
  topHalo: {
    position: 'absolute',
    top: 26,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.halo,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
  },
  headerCard: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: colors.panel,
    shadowColor: colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
  },
  headerTitle: {
    marginTop: 22,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: colors.textLight,
  },
  headerSubtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMutedLight,
  },
  benefitsRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  benefitChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  formCard: {
    marginTop: 18,
    padding: 22,
    borderRadius: 28,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },
  formTitle: {
    fontSize: 28,
    lineHeight: 31,
    fontWeight: '900',
    color: colors.textDark,
  },
  formSubtitle: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMutedDark,
  },
  dividerRow: {
    marginTop: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMutedDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  googleButton: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  googleButtonPressed: {
    transform: [{ translateY: 1 }],
    backgroundColor: '#eef3ef',
  },
  googleButtonDisabled: {
    opacity: 0.75,
  },
  googleMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f4f7',
    borderWidth: 1,
    borderColor: '#d5dbe3',
  },
  googleMarkText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1f2937',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
  },
  googleHint: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMutedDark,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentDark,
  },
  messageCard: {
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
  },
  messageCardNeutral: {
    backgroundColor: colors.cardMuted,
    borderColor: colors.borderLight,
  },
  messageCardError: {
    backgroundColor: '#fff5f5',
    borderColor: '#efc5c5',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMutedDark,
    fontWeight: '600',
  },
  messageTextError: {
    color: colors.error,
  },
});
