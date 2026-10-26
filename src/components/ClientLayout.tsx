"use client";

import React, { useState, useEffect } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlaylistProvider } from "@/context/PlaylistContext";
import PlayerBar from "@/components/PlayerBar";
import TopBar from "@/components/TopBar";
import SideBar from "@/components/SideBar";
import ContextBar from "@/components/ContextBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { restoreSizes, startResizing } from '@/utils/resizer';
import { usePlayer } from '@/context/PlayerContext';

function ContextBarWrapper() {
  const { contextView, currentTrack } = usePlayer();
  // Nothing playing: give the space back to the main content
  if (!contextView || !currentTrack) return null;
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

  useEffect(restoreSizes, []);

  // Once the page has loaded: by the time this runs it often has, and waiting
  // for a load that already happened left the worker (and the install) out
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
    };
    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  // A cover that fails to load: see COVER_FALLBACK_SCRIPT (in the layout's <head>)

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
                <Footer />
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
