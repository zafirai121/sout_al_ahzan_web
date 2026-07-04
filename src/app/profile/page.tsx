"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();
  const { playlists, likedTracks } = usePlaylists();
  const router = useRouter();

  return (
    <div style={{ padding: '40px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
        <div style={{ width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', fontWeight: 'bold', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>الملف الشخصي</span>
          <h1 style={{ fontSize: '64px', fontWeight: '900', margin: '8px 0', direction: 'ltr' }}>{user?.email ? user.email.split('@')[0] : 'المستخدم'}</h1>
          <span style={{ color: '#b3b3b3' }}>{playlists.length} قوائم عامة • {likedTracks.length} مقطع مفضل</span>
        </div>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>قوائم التشغيل الخاصة بك</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
        {playlists.length === 0 && <p style={{ color: '#b3b3b3' }}>لا يوجد لديك قوائم تشغيل حالياً.</p>}
        {playlists.map(p => (
          <div key={p.id} onClick={() => router.push(`/playlists?id=${p.id}`)} style={{ backgroundColor: '#181818', padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181818'}>
             <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#333', borderRadius: '4px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg width="48" height="48" viewBox="0 0 24 24" fill="#b3b3b3"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v4H7v2h4v4h2v-4h4v-2h-4V7z"/></svg>
             </div>
             <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
             <div style={{ color: '#b3b3b3', fontSize: '14px' }}>بواسطة {user?.email?.split('@')[0] || 'أنت'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
