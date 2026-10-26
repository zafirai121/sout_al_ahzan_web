"use client";

// How to install the site as an app on this computer, for when the browser
// doesn't offer it itself (Safari and Firefox never do; Chrome and Edge not
// once it's installed)

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { MonitorDown, X } from 'lucide-react';
import './install-help.css';

type Browser = 'chrome' | 'edge' | 'safari' | 'firefox';

function browserOf(ua: string): Browser {
  if (/Edg\//.test(ua)) return 'edge';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Chrome\//.test(ua)) return 'chrome';
  if (/Safari\//.test(ua)) return 'safari';
  return 'chrome';
}

const STEPS: Record<Browser, string[]> = {
  chrome: [
    'اضغط أيقونة التثبيت في طرف شريط العنوان أعلى المتصفح.',
    'أو افتح قائمة Chrome (⋮) واختر «تثبيت صوت الأحزان».',
  ],
  edge: [
    'اضغط أيقونة التثبيت في طرف شريط العنوان أعلى المتصفح.',
    'أو افتح قائمة Edge (…) واختر «التطبيقات» ثم «تثبيت هذا الموقع كتطبيق».',
  ],
  safari: [
    'من قائمة «ملف» أعلى الشاشة اختر «إضافة إلى Dock».',
    'يحتاج ذلك macOS Sonoma أو أحدث.',
  ],
  firefox: [
    'متصفح Firefox لا يثبّت المواقع كتطبيقات.',
    'افتح web.soutalahzan.com في Chrome أو Edge وثبّته من هناك.',
  ],
};

export default function InstallHelp({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const steps = STEPS[browserOf(navigator.userAgent)];

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="install-overlay" onClick={onClose}>
      <div className="install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={e => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="install-close" onClick={onClose} aria-label="إغلاق">
          <X size={20} />
        </button>
        <span className="install-icon" aria-hidden="true"><MonitorDown size={28} /></span>
        <h2 id="install-title" className="install-title">ثبّت صوت الأحزان على حاسوبك</h2>
        <p className="install-lead">يفتح في نافذة خاصة به، وتجده بين برامج حاسوبك.</p>
        <ol className="install-steps">
          {steps.map(step => <li key={step}>{step}</li>)}
        </ol>
        <p className="install-note">إذا كان مثبّتاً من قبل فستجده في قائمة البرامج.</p>
        <Link href="/download" prefetch={false} className="install-phone" onClick={onClose}>
          تريده على هاتفك؟ نزّل تطبيق أندرويد
        </Link>
      </div>
    </div>
  );
}
