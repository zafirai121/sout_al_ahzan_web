"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Library, Search } from 'lucide-react';

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
        <House size={24} strokeWidth={isActive('/') ? '0' : '2'} />
        <span>الرئيسية</span>
      </Link>
      
      <Link href="/search" className={`mobile-nav-item ${isActive('/search') ? 'active' : ''}`}>
        <Search size={24} strokeWidth={isActive('/search') ? '3' : '2'} />
        <span>البحث</span>
      </Link>
      
      <Link href="/playlists" className={`mobile-nav-item ${isActive('/playlists') ? 'active' : ''}`}>
        <Library size={24} strokeWidth={isActive('/playlists') ? '0' : '2'} />
        <span>مكتبتك</span>
      </Link>
    </nav>
  );
}
