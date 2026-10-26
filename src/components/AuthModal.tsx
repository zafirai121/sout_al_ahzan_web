"use client";

// Signing in, as the phone app has it: a gold top with a greeting and two soft
// leaves in its corner, the logo sitting on the edge of a dark rounded card,
// the form in the card; making an account, the card higher up. The same
// accounts as the app (the name goes in as full_name, as the app sends it).

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import './AuthModal.css';
import { ArrowRight, Check, CircleX, Eye, EyeOff, Lock, Mail, User, X } from 'lucide-react';

type Said = { text: string; error: boolean };

/** What the auth service said, in the app's words */
function errorText(raw: string, status?: number): string {
  const m = raw.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid_credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user_already_exists')) return 'هذا البريد الإلكتروني مسجل مسبقاً، سجّل الدخول بدلاً من ذلك';
  if (m.includes('not confirmed')) return 'يرجى تأكيد البريد الإلكتروني أولاً من الرسالة التي وصلتك';
  if (status === 429 || m.includes('rate limit') || m.includes('security purposes')) return 'محاولات كثيرة، انتظر قليلاً ثم حاول مجدداً';
  if (m.includes('invalid format') || m.includes('valid email') || m.includes('email_address_invalid')) return 'صيغة البريد الإلكتروني غير صحيحة';
  if (m.includes('password')) return 'كلمة المرور ضعيفة، اختر كلمة أطول وأقوى';
  if (m.includes('signup') && m.includes('disabled')) return 'إنشاء الحسابات متوقف حالياً';
  return 'حدث خطأ، يرجى المحاولة مجدداً';
}

/** A field as the app's: a pill, the icon at its start, the hint inside; a password can be shown. */
function AuthField({ icon, hint, value, onChange, type = 'text', autoComplete, secret = false, inputRef }: {
  icon: React.ReactNode;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete: string;
  secret?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const [shown, setShown] = useState(false);
  return (
    <label className="auth-field">
      <span className="auth-field-icon" aria-hidden="true">{icon}</span>
      <input
        ref={inputRef}
        type={secret && !shown ? 'password' : type}
        // Addresses and passwords are written left to right, from the field's start
        dir={type === 'email' || secret ? 'ltr' : undefined}
        placeholder={hint}
        aria-label={hint}
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {secret ? (
        <button
          type="button"
          className="auth-field-eye"
          onClick={() => setShown(s => !s)}
          aria-label={shown ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          title={shown ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      ) : null}
    </label>
  );
}

/** Google's "G" and Facebook's "f", as the app draws them */
const GoogleMark = () => (
  <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);
const FacebookMark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path fill="#fff" d="M10.2 24V13.4H7.9v-2.7h2.3V8.2c0-2.6 1.5-4.1 3.9-4.1.9 0 1.7.1 2.2.2v2.6h-1.5c-1 0-1.4.5-1.4 1.4v2.4H16l-.4 2.7h-2.2V24z" />
  </svg>
);

export default function AuthModal({ onClose, initialIsLogin = true }: { onClose: () => void, initialIsLogin?: boolean }) {
  const [signUp, setSignUp] = useState(!initialIsLogin);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<Said | null>(null);
  const first = useRef<HTMLInputElement>(null);

  // Esc closes it, as clicking outside does
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  // The first field of each face, ready to type in
  useEffect(() => { first.current?.focus(); }, [signUp]);

  const switchTo = (toSignUp: boolean) => {
    setSaid(null);
    setSignUp(toSignUp);
  };

  const attempt = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setSaid(null);
    try {
      await work();
    } catch (err: any) {
      setSaid({ text: errorText(err?.message ?? '', err?.status), error: true });
    } finally {
      setBusy(false);
    }
  };

  const login = () => {
    const e = email.trim();
    if (!e || !password) return setSaid({ text: 'يرجى تعبئة جميع الحقول', error: true });
    attempt(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: e, password });
      if (error) throw error;
      onClose();
    });
  };

  const create = () => {
    const e = email.trim();
    if (!e || !password || !confirm) return setSaid({ text: 'يرجى تعبئة جميع الحقول', error: true });
    if (password.length < 6) return setSaid({ text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', error: true });
    if (password !== confirm) return setSaid({ text: 'كلمتا المرور غير متطابقتين', error: true });
    attempt(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
        options: { data: { full_name: name.trim() || e.split('@')[0] } },
      });
      if (error) throw error;
      if (data.session) return onClose();
      // With e-mail confirmation on, an address already in use comes back as a user with no identities
      if (data.user && data.user.identities?.length === 0) throw new Error('already registered');
      setPassword('');
      setConfirm('');
      setSignUp(false);
      setSaid({ text: 'تم إنشاء الحساب! تفقد بريدك لتفعيله ثم سجّل الدخول.', error: false });
    });
  };

  const forgot = () => {
    const e = email.trim();
    if (!e) return setSaid({ text: 'اكتب بريدك الإلكتروني أولاً، ثم اضغط «نسيت كلمة المرور؟»', error: true });
    attempt(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(e);
      if (error) throw error;
      setSaid({ text: 'أرسلنا إلى بريدك رابطاً لتعيين كلمة مرور جديدة', error: false });
    });
  };

  // Google or Facebook: their page, then back to this one signed in
  const social = (provider: 'google' | 'facebook') => attempt(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.href,
        // Google's account chooser every time, as in the app
        ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
      },
    });
    if (error) throw error;
  });

  const message = said ? (
    <div className={`auth-message${said.error ? ' is-error' : ''}`} role={said.error ? 'alert' : 'status'}>
      {said.error ? <CircleX size={18} /> : <Check size={18} />}
      <span>{said.text}</span>
    </div>
  ) : null;

  return (
    <div className="auth-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className={`auth-modal${signUp ? ' is-signup' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <div className="auth-top">
          {/* Two soft leaves and a dot in the corner, as the app's */}
          <svg className="auth-leaves" viewBox="0 0 210 210" aria-hidden="true">
            <ellipse cx="168" cy="12.6" rx="99.75" ry="52.5" transform="rotate(-32 168 12.6)" opacity="0.22" />
            <ellipse cx="210" cy="96.6" rx="63" ry="35.7" transform="rotate(38 210 96.6)" opacity="0.15" />
            <circle cx="58.8" cy="63" r="10.5" opacity="0.16" />
          </svg>
          <button type="button" className="auth-close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
          <div className="auth-greeting" aria-hidden={signUp}>
            <p className="auth-hello">أهلاً!</p>
            <p className="auth-welcome">مرحباً بك في صوت الأحزان</p>
          </div>
        </div>

        <div className="auth-card">
          <span className="auth-logo" aria-hidden={signUp}>
            <img src="/logo-s.svg" alt="صوت الأحزان" width={38} height={45} />
          </span>

          {/* Keyed by the face, so the new one fades in */}
          <form key={signUp ? 'signup' : 'login'} className="auth-face" noValidate onSubmit={e => { e.preventDefault(); if (signUp) create(); else login(); }}>
            {signUp ? (
              <>
                <button type="button" className="auth-back" onClick={() => switchTo(false)}>
                  <ArrowRight size={16} />
                  العودة لتسجيل الدخول
                </button>
                <h2 id="auth-title" className="auth-title">إنشاء حساب</h2>
                <div className="auth-fields">
                  <AuthField inputRef={first} icon={<User size={18} />} hint="الاسم" value={name} onChange={setName} autoComplete="name" />
                  <AuthField icon={<Mail size={18} />} hint="البريد الإلكتروني" value={email} onChange={setEmail} type="email" autoComplete="email" />
                  <AuthField icon={<Lock size={18} />} hint="كلمة المرور" value={password} onChange={setPassword} autoComplete="new-password" secret />
                  <AuthField icon={<Lock size={18} />} hint="تأكيد كلمة المرور" value={confirm} onChange={setConfirm} autoComplete="new-password" secret />
                </div>
                <button type="submit" className="auth-gold" disabled={busy}>
                  {busy ? <span className="auth-spinner" aria-label="جارٍ إنشاء الحساب" /> : 'إنشاء الحساب'}
                </button>
                {message}
                {/* What an account does, as it is: the site keeps the library in the browser */}
                <p className="auth-note">بالحساب نفسه تدخل تطبيق الهاتف، فتُحفظ فيه إعجاباتك وقوائمك على كل أجهزتك. وفي هذا الموقع تحتاجه لرفع القصائد.</p>
              </>
            ) : (
              <>
                <h2 id="auth-title" className="auth-title">تسجيل الدخول</h2>
                <div className="auth-fields">
                  <AuthField inputRef={first} icon={<Mail size={18} />} hint="البريد الإلكتروني" value={email} onChange={setEmail} type="email" autoComplete="email" />
                  <AuthField icon={<Lock size={18} />} hint="كلمة المرور" value={password} onChange={setPassword} autoComplete="current-password" secret />
                </div>
                <button type="button" className="auth-forgot" onClick={forgot} disabled={busy}>نسيت كلمة المرور؟</button>
                <button type="submit" className="auth-gold" disabled={busy}>
                  {busy ? <span className="auth-spinner" aria-label="جارٍ تسجيل الدخول" /> : 'دخول'}
                </button>
                {message}
                <div className="auth-or"><span>أو سجّل الدخول عبر</span></div>
                <div className="auth-socials">
                  <button type="button" className="auth-social" onClick={() => social('facebook')} disabled={busy} aria-label="الدخول بحساب فيسبوك" title="فيسبوك">
                    <FacebookMark />
                  </button>
                  <button type="button" className="auth-social" onClick={() => social('google')} disabled={busy} aria-label="الدخول بحساب جوجل" title="جوجل">
                    <GoogleMark />
                  </button>
                </div>
                <p className="auth-switch">
                  ليس لديك حساب؟
                  <button type="button" onClick={() => switchTo(true)}>إنشاء حساب</button>
                </p>
                {/* The site works without an account too */}
                <button type="button" className="auth-skip" onClick={onClose}>المتابعة بدون حساب</button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
