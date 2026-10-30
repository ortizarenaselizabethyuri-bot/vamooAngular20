export type AuthMode = 'login' | 'register' | 'recovery';

export type AuthMethod = 'email' | 'google';

export type RegistrationStep = 
  | 'choose_method'
  | 'email_form'
  | 'age_denied'
  | 'username_taken'
  | 'otp_verification'
  | 'google_prompt'
  | 'account_activated';

export type RecoveryStep = 
  | 'request_email'
  | 'otp_and_new_password'
  | 'recovery_success';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  avatar: string;
  birthDate?: string;
  age: number;
  provider: 'email' | 'google';
  isActive: boolean;
  rank: string;
  xp: number;
  tutorialCompleted: boolean;
  createdAt: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  birthDate: string;
  age: number;
  password?: string;
  confirmPassword?: string;
  acceptTerms: boolean;
}

export interface AuthState {
  mode: AuthMode;
  method: AuthMethod;
  registrationStep: RegistrationStep;
  recoveryStep: RecoveryStep;
  failedLoginAttempts: number;
  maxFailedAttempts: number;
  isLockedOut: boolean;
  lockoutSecondsRemaining: number;
  rememberMe: boolean;
  pendingOtpCode: string | null;
  otpCountdown: number;
  lastErrorMessage: string | null;
  lastSuccessMessage: string | null;
  isLoading: boolean;
}
