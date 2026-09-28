"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthModal from './AuthModal';
import DropdownMenu from './DropdownMenu';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { thumb } from '@/utils/image';
import { Check, ExternalLink, House, Menu, Mic, Search } from 'lucide-react';

export default function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [query, setQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login'|'register'>('login');
  const [suggestions, setSuggestions] = useState<{type: 'track'|'reciter', id: string, name: string, sub?: string, image: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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
      
      const words = q.split(' ').filter(w => w.trim());
      
      // 1. Search tracks
      let audioQuery = supabase.from('audio_library').select('*');
      words.forEach(word => {
        audioQuery = audioQuery.or(`title.ilike.%${word}%,reciter_name.ilike.%${word}%`);
      });
      const { data: trackRes } = await audioQuery.limit(3);

      // 2. Search reciters
      let reciterQuery = supabase.from('reciters').select('*');
      words.forEach(word => {
        reciterQuery = reciterQuery.ilike('name', `%${word}%`);
      });
      const { data: reciterRes } = await reciterQuery.limit(2);

      const newSuggestions: any[] = [];
      if (reciterRes) {
        reciterRes.forEach(r => newSuggestions.push({ type: 'reciter', id: r.id, name: r.name, sub: 'فنان', image: r.image_url || r.imageUrl || '' }));
      }
      if (trackRes) {
        trackRes.forEach(t => newSuggestions.push({ type: 'track', id: t.id, name: t.title, sub: t.reciter_name || 'مقطع', image: t.image_url || t.imageUrl || t.thumbnail_url || '' }));
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
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("التطبيق مثبت بالفعل أو أن المتصفح لا يدعم هذه الميزة حالياً.");
    }
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
          />
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--text-base)', margin: '0 12px' }}></div>
          <Mic size={24} />

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
                    if (sug.type === 'reciter') {
                      router.push(`/reciter?id=${sug.id}`);
                    } else {
                      router.push(`/search?q=${encodeURIComponent(sug.name)}`);
                    }
                  }}
                >
                  <img 
                    src={thumb(sug.image || '/icon.png', 40)} 
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
        <a href="#" className="top-link" onClick={handleInstallClick}>تثبيت التطبيق</a>
        <a href="#" className="top-link" onClick={(e) => { e.preventDefault(); alert("لتحميل مقطع صوتي، استخدم زر التنزيل الموجود في مشغل الصوت بالأسفل. هذا الزر سيخصص لتنزيل تطبيق الحاسوب قريباً."); }}>تنزيل</a>
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
                { label: 'قم بالترقية إلى حساب Premium', onClick: () => router.push('/premium'), rightIcon: <ExternalLink size={16} /> },
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
    </header>
  );
}
