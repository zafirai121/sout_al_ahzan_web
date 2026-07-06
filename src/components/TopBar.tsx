"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthModal from './AuthModal';
import DropdownMenu from './DropdownMenu';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [query, setQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login'|'register'>('login');
  const [suggestions, setSuggestions] = useState<{type: 'track'|'reciter', id: string, name: string, sub?: string, image: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();

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

  return (
    <header className="top-bar">
      <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onMenuClick && (
          <div className="mobile-hamburger" onClick={onMenuClick}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </div>
        )}
        <Link href="/">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', cursor: 'pointer' }} title="صوت الأحزان">
            <svg width="36" height="36" viewBox="0 0 100 100">
              <text x="50" y="80" fontSize="90" fontWeight="900" fontStyle="italic" fontFamily="Arial, Impact, sans-serif" fill="#F05B28" textAnchor="middle">S</text>
            </svg>
          </div>
        </Link>
        <Link href="/">
          <button className="icon-btn" title="الرئيسية" style={{ display: 'none' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"/></svg>
          </button>
        </Link>
      </div>

      <div className="top-bar-center">
        <div className="search-container" ref={searchContainerRef}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--text-base)"><path d="M10.533 1.27893C5.35215 1.27893 1.12598 5.41887 1.12598 10.5579C1.12598 15.697 5.35215 19.8369 10.533 19.8369C12.767 19.8369 14.8196 19.0671 16.4402 17.7794L20.7929 22.132C21.1834 22.5226 21.8166 22.5226 22.2071 22.132C22.5976 21.7415 22.5976 21.1083 22.2071 20.7178L17.8634 16.3741C19.1616 14.7849 19.94 12.7634 19.94 10.5579C19.94 5.41887 15.7138 1.27893 10.533 1.27893ZM3.12598 10.5579C3.12598 6.53225 6.4259 3.27893 10.533 3.27893C14.6401 3.27893 17.94 6.53225 17.94 10.5579C17.94 14.5836 14.6401 17.8369 10.533 17.8369C6.4259 17.8369 3.12598 14.5836 3.12598 10.5579Z"/></svg>
          <input 
            type="text" 
            placeholder="البحث عن قصيدة أو رادود..." 
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleSearch}
          />
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--text-base)', margin: '0 12px' }}></div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--text-base)" onClick={() => {if(query.trim()) { setShowSuggestions(false); router.push(`/search?q=${encodeURIComponent(query.trim())}`);}}} style={{cursor: 'pointer'}}><path d="M15 11c0 1.657-1.343 3-3 3s-3-1.343-3-3V5c0-1.657 1.343-3 3-3s3 1.343 3 3v6zM4 11a1 1 0 00-2 0 10 10 0 009 9.95V23a1 1 0 002 0v-2.05A10 10 0 0022 11a1 1 0 00-2 0 8 8 0 01-16 0z"/></svg>

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
                    src={sug.image || 'https://via.placeholder.com/40'} 
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
        <a href="#" className="top-link" onClick={(e) => { e.preventDefault(); alert("ميزة تثبيت التطبيق قيد التطوير"); }}>تثبيت التطبيق</a>
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
                { label: 'حساب', onClick: () => router.push('/account'), rightIcon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> },
                { label: 'الصفحة الشخصية', onClick: () => router.push('/profile') },
                { label: 'الأحدث', onClick: () => router.push('/recent') },
                { label: 'قم بالترقية إلى حساب Premium', onClick: () => router.push('/premium'), rightIcon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> },
                { label: 'الدعم', onClick: () => router.push('/support'), rightIcon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> },
                { label: 'تنزيل', onClick: () => router.push('/download'), rightIcon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg> },
                { label: 'الإعدادات', onClick: () => router.push('/settings') },
                { type: 'divider' },
                { label: 'سجل الخروج', onClick: signOut },
                { type: 'divider' },
                { type: 'custom', content: (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', alignSelf: 'flex-start', color: '#fff', marginBottom: '8px' }}>التحديثات</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 0' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
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
            <a href="#" className="top-link" onClick={(e) => { e.preventDefault(); setAuthMode('register'); setShowAuthModal(true); }}>تسجيل</a>
            <button className="btn-login" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>سجل الدخول</button>
          </>
        )}
      </div>
      
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} initialIsLogin={authMode === 'login'} />}
    </header>
  );
}
