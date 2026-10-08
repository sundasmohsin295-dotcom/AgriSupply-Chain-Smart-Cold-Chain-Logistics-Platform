import React, { useState, useEffect } from 'react';
import { UserRole } from '../../types';
import { 
  registerWithEmailPassword, 
  loginWithEmailPassword, 
  sendPasswordReset, 
  resendVerificationEmail, 
  formatFirebaseAuthError,
  FirestoreUserProfile
} from '../../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { generateSignedJWT } from '../../lib/jwtAuth';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  KeyRound, 
  ShieldCheck, 
  Sparkles,
  Tractor,
  Truck,
  Warehouse,
  Store,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: FirebaseUser | null, profile: FirestoreUserProfile | null, isQuickDemo?: boolean, demoRole?: UserRole) => void;
  currentRole?: UserRole;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'VERIFY_GATE' | 'FORGOT_PASSWORD';

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentRole
}) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('Punjab Agri Coop');
  const [location, setLocation] = useState('Multan Hub');
  const [role, setRole] = useState<UserRole>('FARMER');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Email verification gate state
  const [pendingUser, setPendingUser] = useState<FirebaseUser | null>(null);
  const [pendingProfile, setPendingProfile] = useState<FirestoreUserProfile | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const { user, profile, isEmailVerified } = await loginWithEmailPassword(email, password);

      if (!isEmailVerified) {
        setPendingUser(user);
        setPendingProfile(profile);
        setMode('VERIFY_GATE');
        setIsLoading(false);
        return;
      }

      // Generate and attach cryptographically signed JWT cookie
      const jwtToken = profile.role ? generateSignedJWT(profile.role, profile.organization) : generateSignedJWT('FARMER');
      if (typeof document !== 'undefined') {
        document.cookie = `agrisupply_jwt=${jwtToken}; path=/; max-age=604800; SameSite=Lax`;
      }

      onAuthSuccess(user, profile);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const { user, profile } = await registerWithEmailPassword(
        email,
        password,
        name,
        role,
        organization,
        location
      );

      setPendingUser(user);
      setPendingProfile(profile);
      setMode('VERIFY_GATE');
      setResendCooldown(60);
    } catch (err: unknown) {
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your account email address first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await sendPasswordReset(email);
      setSuccessNotice('Password reset link sent! Please check your inbox and spam folder.');
    } catch (err: unknown) {
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingUser) return;
    setIsLoading(true);
    setErrorMessage(null);

    const res = await resendVerificationEmail(pendingUser);
    setIsLoading(false);

    if (res.success) {
      setSuccessNotice(res.message);
      setResendCooldown(60);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleCheckEmailVerified = async () => {
    if (!pendingUser) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await pendingUser.reload();
      if (pendingUser.emailVerified) {
        onAuthSuccess(pendingUser, pendingProfile);
        onClose();
      } else {
        setErrorMessage('Email not yet verified. Please click the link in the verification email sent to your inbox.');
      }
    } catch {
      setErrorMessage('Unable to check verification status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoPersona = (demoRole: UserRole) => {
    onAuthSuccess(null, null, true, demoRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
      >
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {mode === 'LOGIN' && 'Sign In to AgriSupply Cloud'}
                {mode === 'SIGNUP' && 'Create Verified Account'}
                {mode === 'VERIFY_GATE' && 'Email Verification Required'}
                {mode === 'FORGOT_PASSWORD' && 'Reset Account Password'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Genuine Firebase Auth & Firestore Multi-Tenant Security
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error / Success Notifications */}
        <div className="px-6 pt-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}
        </div>

        {/* Body content based on current mode */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            
            {/* LOGIN MODE */}
            {mode === 'LOGIN' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@agricoop.pk"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('FORGOT_PASSWORD')}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Sign In with Firebase</span>
                </button>

                <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('SIGNUP');
                      setErrorMessage(null);
                      setSuccessNotice(null);
                    }}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Create new account
                  </button>
                </div>
              </motion.form>
            )}

            {/* SIGNUP MODE */}
            {mode === 'SIGNUP' && (
              <motion.form 
                key="signup"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSignup}
                className="space-y-3.5"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tariq Mansoor"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Platform Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="FARMER">Farmer (Producer)</option>
                      <option value="TRANSPORTER">Transporter (Fleet)</option>
                      <option value="WAREHOUSE_ADMIN">Warehouse Admin</option>
                      <option value="RETAILER">Retailer (Receiver)</option>
                      <option value="COMPLIANCE_AUDITOR">Compliance Auditor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@domain.com"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Organization
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Operating Region
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Sign Up & Send Verification Email</span>
                </button>

                <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('LOGIN');
                      setErrorMessage(null);
                      setSuccessNotice(null);
                    }}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Log in
                  </button>
                </div>
              </motion.form>
            )}

            {/* VERIFY EMAIL GATE */}
            {mode === 'VERIFY_GATE' && (
              <motion.div 
                key="verify"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 text-center py-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Check your inbox!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    A real verification link was dispatched to{' '}
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {pendingUser?.email || email}
                    </span>.
                    Access to the operational cold-chain portal is blocked until verified.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-[11px] text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                  <div>1. Open your email client.</div>
                  <div>2. Click the verification URL sent by Firebase.</div>
                  <div>3. Click "I've Verified My Email" below to unlock portal.</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={handleCheckEmailVerified}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>I've Verified My Email</span>
                  </button>

                  <button
                    onClick={handleResendVerification}
                    disabled={isLoading || resendCooldown > 0}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-300 dark:border-slate-700 transition disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Email'}
                  </button>
                </div>

                <div>
                  <button
                    onClick={() => setMode('LOGIN')}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                  >
                    Return to Login Screen
                  </button>
                </div>
              </motion.div>
            )}

            {/* FORGOT PASSWORD */}
            {mode === 'FORGOT_PASSWORD' && (
              <motion.form 
                key="forgot"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleForgotPassword}
                className="space-y-4"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your email address and we'll dispatch an automated password reset link via Firebase Authentication.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@agricoop.pk"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('LOGIN')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-300 dark:border-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    <span>Send Reset Email</span>
                  </button>
                </div>
              </motion.form>
            )}

          </AnimatePresence>
        </div>

        {/* Footer: Production Enterprise Security & Compliance Notice */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0a0f16] border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Tenant Cryptographic RBAC Guarded</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-bold">
              FSMA 204 Compliant
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Every verified sign-in issues a signed 7-day HMAC-SHA256 JWT session cookie with role claims bound to your agricultural cooperative or logistics terminal.
          </p>
        </div>

      </motion.div>
    </div>
  );
};
