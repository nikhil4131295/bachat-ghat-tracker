import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Sparkles, UserCheck, ShieldCheck, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LANGUAGES = [
  { code: 'mr', name: 'मराठी', flag: '🚩' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en', name: 'English', flag: '🌐' },
];

export const WelcomePage: React.FC<{ onGroupSetupNeeded: () => void }> = ({ onGroupSetupNeeded }) => {
  const { t, i18n } = useTranslation();
  const { startDemoMode, setUserRole } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('treasurer');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        // Fallback for offline/local simulation
        localStorage.setItem('bg_user_role', selectedRole);
        setUserRole(selectedRole);
        if (selectedRole === 'treasurer') {
          onGroupSetupNeeded();
        }
        return;
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: selectedRole },
          },
        });
        if (error) throw error;

        if (data.user) {
          // Store role in user_roles table
          await supabase.from('user_roles').insert([
            { user_id: data.user.id, role: selectedRole },
          ]);
          // Create profile
          await supabase.from('profiles').insert([
            { id: data.user.id, full_name: fullName || email.split('@')[0] },
          ]);
          localStorage.setItem('bg_user_role', selectedRole);
          setUserRole(selectedRole);
          if (selectedRole === 'treasurer') {
            onGroupSetupNeeded();
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          // Fetch role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

          const role = (roleData?.role as UserRole) || selectedRole;
          localStorage.setItem('bg_user_role', role);
          setUserRole(role);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-teal-surface border-2 border-teal-light/30 items-center justify-center shadow-md">
            <Building2 className="w-9 h-9 text-teal-dark" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-teal-dark tracking-tight">
            {t('appName')}
          </h1>
          <p className="text-sm text-muted font-medium max-w-xs mx-auto">
            {t('appSubtitle')}
          </p>
        </div>

        {/* 1. Language Picker (3 Big Cards) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-2">
          <p className="text-xs font-bold text-muted uppercase tracking-wider text-center">
            {t('selectLanguage')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map(lang => {
              const active = i18n.language.startsWith(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`min-h-[50px] p-2 rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${
                    active
                      ? 'border-teal-primary bg-teal-surface text-teal-dark shadow-xs'
                      : 'border-gray-200 hover:border-teal-light/50 bg-white text-foreground'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="text-xs font-bold font-heading">{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Try Demo Button (Prominent, Zero Friction) */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-amber-950">
                {t('tryDemo')}
              </h2>
              <p className="text-xs text-amber-800 font-medium">
                {t('tryDemoDesc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={startDemoMode}
            className="w-full min-h-touch py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-amber-950 font-heading font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{t('tryDemo')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Role Picker */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <p className="text-xs font-bold text-muted uppercase tracking-wider text-center">
            {t('iAmTreasurer')} / {t('iAmOfficer')}
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Treasurer Card */}
            <button
              type="button"
              onClick={() => setSelectedRole('treasurer')}
              className={`min-h-[64px] p-4 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${
                selectedRole === 'treasurer'
                  ? 'border-teal-primary bg-teal-surface shadow-xs'
                  : 'border-gray-200 hover:border-teal-light/40 bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedRole === 'treasurer'
                    ? 'bg-teal-primary text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-foreground">
                  {t('iAmTreasurer')}
                </div>
                <div className="text-xs text-muted font-medium">
                  {t('iAmTreasurerDesc')}
                </div>
              </div>
            </button>

            {/* Officer Card */}
            <button
              type="button"
              onClick={() => setSelectedRole('officer')}
              className={`min-h-[64px] p-4 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${
                selectedRole === 'officer'
                  ? 'border-teal-primary bg-teal-surface shadow-xs'
                  : 'border-gray-200 hover:border-teal-light/40 bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedRole === 'officer'
                    ? 'bg-teal-primary text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-foreground">
                  {t('iAmOfficer')}
                </div>
                <div className="text-xs text-muted font-medium">
                  {t('iAmOfficerDesc')}
                </div>
              </div>
            </button>
          </div>

          {/* Login / Sign Up Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-3 pt-2">
            {authError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {authError}
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  {t('name')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="सुनिता शिंदे"
                    className="w-full min-h-touch pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-muted mb-1">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="sunita@example.com"
                  className="w-full min-h-touch pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-touch pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-touch py-3 px-4 rounded-2xl bg-teal-primary hover:bg-teal-dark active:scale-98 text-white font-heading font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{isSubmitting ? '...' : isSignUp ? t('signup') : t('login')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-xs text-teal-dark font-bold hover:underline py-1.5"
            >
              {isSignUp ? t('alreadyHaveAccount') : t('dontHaveAccount')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
