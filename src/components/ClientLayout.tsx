"use client";

import React, { useState } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlaylistProvider } from "@/context/PlaylistContext";
import PlayerBar from "@/components/PlayerBar";
import TopBar from "@/components/TopBar";
import SideBar from "@/components/SideBar";
import ContextBar from "@/components/ContextBar";

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <PlaylistProvider>
        <PlayerProvider>
          <div className="app-container">
            <TopBar onMenuClick={toggleDrawer} />
            <div className="main-wrapper">
              <SideBar />
              <main className="main-content">
                {children}
              </main>
              <ContextBar />
            </div>
            <PlayerBar />
            
            {/* Mobile Drawer */}
            <div className={`mobile-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={closeDrawer}></div>
            <div className={`mobile-drawer ${isDrawerOpen ? 'open' : ''}`}>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-start' }}>
                <button onClick={closeDrawer} style={{ fontSize: '24px', padding: '8px' }}>✕</button>
              </div>
              <SideBar />
              <ContextBar />
            </div>
          </div>
        </PlayerProvider>
      </PlaylistProvider>
    </AuthProvider>
  );
}
