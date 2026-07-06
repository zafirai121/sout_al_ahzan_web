"use client";

import React, { useState, useEffect } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlaylistProvider } from "@/context/PlaylistContext";
import PlayerBar from "@/components/PlayerBar";
import TopBar from "@/components/TopBar";
import SideBar from "@/components/SideBar";
import ContextBar from "@/components/ContextBar";
import MobileBottomNav from "@/components/MobileBottomNav";

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { startResizing } from '@/utils/resizer';
import { usePlayer } from '@/context/PlayerContext';

function ContextBarWrapper() {
  const { contextView } = usePlayer();
  if (!contextView) return null;
  return (
    <>
      <div className="resizer" onMouseDown={(e) => startResizing(e, 'left')} title="تغيير حجم القائمة" />
      <ContextBar />
    </>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });
      });
    }
  }, []);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <PlaylistProvider>
        <PlayerProvider>
          <div className="app-container">
            <TopBar onMenuClick={() => {}} />
            <div className="main-wrapper">
              <SideBar />
              <div className="resizer" onMouseDown={(e) => startResizing(e, 'right')} title="تغيير حجم القائمة" />
              <main className="main-content">
                {children}
              </main>
              <ContextBarWrapper />
            </div>
            <PlayerBar />
            
            {/* Mobile Bottom Navigation (Visible only on mobile via CSS) */}
            <MobileBottomNav />
          </div>
        </PlayerProvider>
      </PlaylistProvider>
    </AuthProvider>
  );
}
