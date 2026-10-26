"use client";

// Settings that do something: the listening history this browser keeps (and
// clearing it), where the library lives, the account. The old audio quality
// and theme choices were saved but read by nothing, so they are gone.

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { countOf, LIKES, PLAYLISTS, TRACKS } from '@/utils/plural';
import { MePage, MePanel, nameOf, SignInButtons } from '@/components/me/Me';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { recentTracks, recentLoaded, clearRecent } = usePlayer();
  const { playlists, likedTracks, libraryLoaded } = usePlaylists();
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);

  return (
    <MePage>
      <header className="info-hero">
        <span className="info-hero-ornament" aria-hidden="true" />
        <h1 className="info-title">الإعدادات</h1>
        <p className="info-lead">سجل استماعك في هذا المتصفح، ومكتبتك وحسابك.</p>
      </header>

      <div className="me-panels">
        <MePanel
          id="settings-history"
          title="سجل الاستماع"
          text="يحفظ هذا المتصفح آخر 30 مقطعاً استمعت إليها. منها يُبنى «تم الاستماع إليه مؤخراً» و«مصممة من أجلك» في الرئيسية، و«رواديد استمعت إليهم» في ملفك."
        >
          <div className="me-actions">
            {recentLoaded ? (
              <span className="me-chip">{recentTracks.length ? `في السجل الآن ${countOf(recentTracks.length, TRACKS)}` : 'السجل فارغ'}</span>
            ) : null}
            {recentTracks.length > 0 ? (
              confirming ? (
                <>
                  <button
                    type="button"
                    className="btn-outline me-danger"
                    onClick={() => { clearRecent(); setConfirming(false); setCleared(true); }}
                  >
                    تأكيد المسح
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setConfirming(false)}>إلغاء</button>
                </>
              ) : (
                <button type="button" className="btn-outline me-danger" onClick={() => { setConfirming(true); setCleared(false); }}>
                  مسح السجل
                </button>
              )
            ) : null}
          </div>
          {cleared ? <p className="me-status" role="status">مُسح سجل الاستماع</p> : null}
        </MePanel>

        <MePanel
          id="settings-library"
          title="مكتبتك"
          text={loading ? undefined : user
            ? 'إعجاباتك وقوائمك محفوظة في حسابك، فتجدها نفسها هنا وفي تطبيق الهاتف على كل أجهزتك. أما مجلدات القوائم فيحفظها هذا المتصفح وحده.'
            : 'إعجاباتك وقوائمك محفوظة في هذا المتصفح، وإذا مسحت بياناته ذهبت معها. سجّل الدخول لتُحفظ في حسابك وتجدها في تطبيق الهاتف، وما في المتصفح الآن ينتقل إليه.'}
        >
          <div className="me-actions">
            {libraryLoaded ? (
              <>
                <span className="me-chip">{likedTracks.length ? countOf(likedTracks.length, LIKES) : 'لا إعجابات بعد'}</span>
                <span className="me-chip">{playlists.length ? countOf(playlists.length, PLAYLISTS) : 'لا قوائم بعد'}</span>
              </>
            ) : null}
          </div>
          <div className="me-links">
            <Link href="/profile" prefetch={false}>افتح مكتبتك</Link>
            <Link href="/download" prefetch={false}>تطبيق الهاتف</Link>
          </div>
        </MePanel>

        <MePanel
          id="settings-account"
          title="الحساب"
          text={loading ? undefined : user
            ? <>مسجّل الدخول باسم {nameOf(user)} (<span dir="ltr">{user.email}</span>).</>
            : 'لم تسجّل الدخول في هذا المتصفح. بالحساب تُحفظ مكتبتك وتجدها في تطبيق الهاتف، وبه ترفع القصائد.'}
        >
          {loading ? null : user ? (
            <div className="me-links"><Link href="/account" prefetch={false}>إدارة الحساب</Link></div>
          ) : (
            <div className="me-actions"><SignInButtons small /></div>
          )}
        </MePanel>
      </div>
    </MePage>
  );
}
