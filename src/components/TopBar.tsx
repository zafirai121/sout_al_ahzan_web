"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthModal from './AuthModal';
import DropdownMenu from './DropdownMenu';
import InstallHelp from './InstallHelp';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { thumb } from '@/utils/image';
import { searchPatterns, titleOrReciter } from '@/utils/arabic_search';
import { Check, ExternalLink, House, Menu, Search } from 'lucide-react';
import { readableTitle } from '@/utils/data_mapper';

export default function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [query, setQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login'|'register'>('login');
  const [suggestions, setSuggestions] = useState<{type: 'track'|'reciter', id: string, name: string, sub?: string, image: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();
  // The browser's offer to install the site (kept by the layout's script), and
  // whether it already runs installed
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const fetchSuggestions = async () => {
      const q = query.trim();
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      
      const words = searchPatterns(q);
      if (words.length === 0) {
        setSuggestions([]);
        return;
      }

      // Tracks and reciters side by side, as the search page orders them
      let audioQuery = supabase.from('audio_library').select('id,title,reciter_name,image_url');
      words.forEach(word => {
        audioQuery = audioQuery.or(titleOrReciter(word));
      });
      let reciterQuery = supabase.from('reciters').select('id,name,image_url').neq('name', 'مجهول');
      words.forEach(word => {
        reciterQuery = reciterQuery.filter('name', 'imatch', word);
      });
      const [{ data: trackRes }, { data: reciterRes }] = await Promise.all([
        audioQuery.order('listen_count', { ascending: false, nullsFirst: false }).limit(4),
        reciterQuery.limit(2),
      ]);

      const newSuggestions: any[] = [];
      if (reciterRes) {
        reciterRes.forEach(r => newSuggestions.push({ type: 'reciter', id: r.id, name: r.name, sub: 'رادود', image: r.image_url || '' }));
      }
      if (trackRes) {
        trackRes.forEach(t => newSuggestions.push({ type: 'track', id: t.id, name: readableTitle(t.title || ''), sub: t.reciter_name || 'مقطع', image: t.image_url || '' }));
      }
      setSuggestions(newSuggestions);
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

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
        <div className="search-container" ref={searchContainerRef}>
          <Search size={24} />
          <input 
            type="text" 
            placeholder="البحث عن قصيدة أو رادود..." 
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleSearch}
            aria-label="البحث عن قصيدة أو رادود"
          />

          {showSuggestions && suggestions.length > 0 && query.length >= 2 && (
            <div style={{
              position: 'absolute',
              top: '56px',
              left: 0,
              right: 0,
              backgroundColor: '#282828',
              borderRadius: '8px',
              padding: '8px 0',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {suggestions.map((sug, idx) => (
                <div 
                  key={`${sug.type}-${sug.id}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3e3e3e'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => {
                    setShowSuggestions(false);
                    setQuery('');
                    router.push(sug.type === 'reciter' ? `/reciter?id=${sug.id}` : `/track?id=${sug.id}`);
                  }}
                >
                  <img 
                    src={thumb(sug.image || '/cover-placeholder.svg', 40)} 
                    alt={sug.name} 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: sug.type === 'reciter' ? '50%' : '4px',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sug.name}</span>
                    <span style={{ color: '#b3b3b3', fontSize: '12px' }}>{sug.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                  width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f15e6c', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' 
                }} title={user.email}>
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
              }
              menuStyle={{ left: 0, right: 'auto' }}
              items={[
                { label: 'حساب', onClick: () => router.push('/account'), rightIcon: <ExternalLink size={16} /> },
                { label: 'الصفحة الشخصية', onClick: () => router.push('/profile') },
                { label: 'رفع مقطع صوتي', onClick: () => router.push('/upload') },
                { label: 'الأحدث', onClick: () => router.push('/recent') },
                { label: 'الدعم', onClick: () => router.push('/support'), rightIcon: <ExternalLink size={16} /> },
                { label: 'تنزيل', onClick: () => router.push('/download'), rightIcon: <ExternalLink size={16} /> },
                { label: 'الإعدادات', onClick: () => router.push('/settings') },
                { type: 'divider' },
                { label: 'سجل الخروج', onClick: signOut },
                { type: 'divider' },
                { type: 'custom', content: (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', alignSelf: 'flex-start', color: '#fff', marginBottom: '8px' }}>التحديثات</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 0' }}>
                      <Check size={32} color="#b3b3b3" />
                      <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>لا يوجد شيء جديد</span>
                      <span style={{ color: '#b3b3b3', fontSize: '12px' }}>يمكنك متابعة هذه الصفحة لمعرفة أخبار متابعيك وقوائم المقاطع والفعاليات، والمزيد.</span>
                    </div>
                  </div>
                ) }
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
