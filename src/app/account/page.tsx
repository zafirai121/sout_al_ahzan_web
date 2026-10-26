"use client";

// The account: who is signed in here, how, since when; a new password by
// e-mail; signing out of this browser, or of everywhere (the phone app too).
// Not signed in: what an account is for, and the way in.

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { MeHead, MePage, MePanel, MeRow, nameOf, SignInButtons } from '@/components/me/Me';

const PROVIDERS: Record<string, string> = {
  email: 'البريد الإلكتروني وكلمة المرور',
  google: 'جوجل',
  facebook: 'فيسبوك',
};

const longDate = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const [said, setSaid] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  // Nothing until it is known whether someone is signed in, so a visitor's page doesn't flash first
  if (loading) return <MePage><div className="info-hero me-head" aria-busy="true" /></MePage>;

  if (!user) {
    return (
      <MePage>
        <MeHead user={null} title="حسابك" line="لم تسجّل الدخول في هذا المتصفح." />
        <MePanel
          id="account-why"
          title="ما الذي يفعله الحساب؟"
          text={
            <>
              الحساب نفسه يعمل في الموقع وفي تطبيق الهاتف. به تُحفظ إعجاباتك وقوائمك فتجدها نفسها في الاثنين وعلى كل أجهزتك، وما حفظته في هذا المتصفح ينتقل إليه حين تسجّل الدخول. وبه ترفع القصائد.
              أما الاستماع هنا، وحفظ الإعجابات والقوائم في هذا المتصفح، فلا يحتاج حساباً.
            </>
          }
        >
          <div className="me-actions"><SignInButtons /></div>
        </MePanel>
      </MePage>
    );
  }

  const providers: string[] = user.app_metadata?.providers ?? (user.app_metadata?.provider ? [user.app_metadata.provider] : []);
  const usesPassword = providers.includes('email');

  const run = async (work: () => Promise<{ error: unknown }>, done?: string) => {
    setBusy(true);
    setSaid(null);
    const { error } = await work();
    setBusy(false);
    if (error) setSaid({ text: 'حدث خطأ، يرجى المحاولة مجدداً', error: true });
    else if (done) setSaid({ text: done });
  };

  return (
    <MePage>
      <MeHead user={user} title={nameOf(user)} line={<span dir="ltr">{user.email}</span>} />

      <div className="me-panels">
        <MePanel id="account-details" title="تفاصيل الحساب">
          <dl className="me-rows">
            <MeRow label="الاسم">{nameOf(user)}</MeRow>
            <MeRow label="البريد الإلكتروني" ltr>{user.email}</MeRow>
            <MeRow label="طريقة الدخول">{providers.map(p => PROVIDERS[p] ?? p).join('، ') || '—'}</MeRow>
            <MeRow label="انضممت في">{longDate.format(new Date(user.created_at))}</MeRow>
          </dl>
          <div className="me-links">
            <Link href="/profile" prefetch={false}>ملفك ومكتبتك</Link>
            <Link href="/settings" prefetch={false}>الإعدادات</Link>
            <Link href="/upload" prefetch={false}>رفع قصيدة</Link>
          </div>
        </MePanel>

        <div className="me-section">
          {usesPassword ? (
            <MePanel id="account-password" title="كلمة المرور" text="نرسل إلى بريدك رابطاً تعيّن منه كلمة مرور جديدة.">
              <div className="me-actions">
                <button
                  type="button"
                  className="btn-outline"
                  disabled={busy}
                  onClick={() => run(() => supabase.auth.resetPasswordForEmail(user.email ?? ''), 'أرسلنا الرابط إلى بريدك')}
                >
                  إرسال الرابط
                </button>
              </div>
            </MePanel>
          ) : null}

          <MePanel id="account-signout" title="تسجيل الخروج" text="من هذا المتصفح وحده، أو من كل مكان سجّلت فيه الدخول، ومنه تطبيق الهاتف. مكتبتك تبقى في حسابك، وتعود حين تسجّل الدخول.">
            <div className="me-actions">
              <button type="button" className="btn-outline" disabled={busy} onClick={() => run(async () => { await signOut(); return { error: null }; })}>
                الخروج من هذا المتصفح
              </button>
              {confirmAll ? (
                <>
                  <button
                    type="button"
                    className="btn-outline me-danger"
                    disabled={busy}
                    onClick={() => run(() => supabase.auth.signOut({ scope: 'global' }))}
                  >
                    تأكيد الخروج من كل مكان
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setConfirmAll(false)}>إلغاء</button>
                </>
              ) : (
                <button type="button" className="btn-outline me-danger" disabled={busy} onClick={() => setConfirmAll(true)}>
                  الخروج من كل مكان
                </button>
              )}
            </div>
          </MePanel>

          {said ? <p className={`me-status${said.error ? ' is-error' : ''}`} role={said.error ? 'alert' : 'status'}>{said.text}</p> : null}
        </div>
      </div>
    </MePage>
  );
}
