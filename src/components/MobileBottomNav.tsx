"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive('/') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isActive('/') ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>الرئيسية</span>
      </Link>
      
      <Link href="/search" className={`mobile-nav-item ${isActive('/search') ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive('/search') ? '3' : '2'} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>البحث</span>
      </Link>
      
      <Link href="/playlists" className={`mobile-nav-item ${isActive('/playlists') ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive('/playlists') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isActive('/playlists') ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19h16v2H4zM4 14h16v2H4zM4 9h16v2H4zM4 4h16v2H4z"/>
        </svg>
        <span>مكتبتك</span>
      </Link>
    </nav>
  );
}
