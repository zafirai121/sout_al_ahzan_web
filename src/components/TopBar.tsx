"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthModal from './AuthModal';
import DropdownMenu from './DropdownMenu';
import InstallHelp from './InstallHelp';
import SearchBox from './search/SearchBox';
import { useAuth } from '@/context/AuthContext';
import { House, Menu } from 'lucide-react';

export default function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login'|'register'>('login');
  const router = useRouter();
  const { user, signOut } = useAuth();
  // The browser's offer to install the site (kept by the layout's script), and
  // whether it already runs installed
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    const w = window as any;
    const sync = () => setInstallPrompt(w.__installPrompt ?? null);
    const done = () => setInstalled(true);
    sync();
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    window.addEventListener('install-ready', sync);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('install-ready', sync);
      window.removeEventListener('appinstalled', done);
    };
  }, []);

  // The browser's own install window when it offers one; how to do it otherwise
  const handleInstallClick = async () => {
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    // An offer is good for one answer
    (window as any).__installPrompt = null;
    setInstallPrompt(null);
    if (outcome === 'accepted') setInstalled(true);
  };

  return (
    <header className="top-bar">
      <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onMenuClick && (
          <div className="mobile-hamburger" onClick={onMenuClick}>
            <Menu size={24} />
          </div>
        )}
        <Link href="/">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', cursor: 'pointer' }} title="صوت الأحزان">
            <svg width="36" height="36" viewBox="0 0 100 100">
              <text x="50" y="80" fontSize="90" fontWeight="900" fontStyle="italic" fontFamily="Arial, Impact, sans-serif" fill="#F05B28" textAnchor="middle">S</text>
            </svg>
          </div>
        </Link>
      </div>

      <div className="top-bar-center" style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
        <Link href="/">
          <button className="icon-btn" title="الرئيسية">
            <House size={24} />
          </button>
        </Link>
        <SearchBox />
      </div>

      <div className="top-bar-left">
        {/* Not shown in the installed app itself */}
        {installed ? null : <button type="button" className="top-link" onClick={handleInstallClick}>تثبيت التطبيق</button>}
        <Link href="/download" prefetch={false} className="top-link">تنزيل</Link>
        <div className="divider-vertical"></div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <DropdownMenu 
              buttonContent={
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gold-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-primary)', fontWeight: 'bold'
                }} title={user.email}>
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
              }
              menuStyle={{ left: 0, right: 'auto' }}
              items={[
                { label: 'حسابك', onClick: () => router.push('/account') },
                { label: 'مكتبتك', onClick: () => router.push('/profile') },
                { label: 'رفع مقطع صوتي', onClick: () => router.push('/upload') },
                { label: 'أحدث الإصدارات', onClick: () => router.push('/explore?type=recent') },
                { label: 'الدعم', onClick: () => router.push('/support') },
                { label: 'تطبيق الهاتف', onClick: () => router.push('/download') },
                { label: 'الإعدادات', onClick: () => router.push('/settings') },
                { type: 'divider' },
                { label: 'سجّل الخروج', onClick: signOut },
              ]}
            />
          </div>
        ) : (
          <>
            <a href="#" className="top-link-auth" style={{ color: '#b3b3b3', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', transition: 'color 0.2s' }} onClick={(e) => { e.preventDefault(); setAuthMode('register'); setShowAuthModal(true); }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}>تسجيل</a>
            <button className="btn-login" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>سجل الدخول</button>
          </>
        )}
      </div>
      
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} initialIsLogin={authMode === 'login'} />}
      {showInstallHelp && <InstallHelp onClose={() => setShowInstallHelp(false)} />}
    </header>
  );
}
