"use client";

import React from "react";
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

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <PlaylistProvider>
        <PlayerProvider>
          <div className="app-container">
            <TopBar />
            <div className="main-wrapper">
              <SideBar />
              <main className="main-content">
                {children}
              </main>
              <ContextBar />
            </div>
            <PlayerBar />
          </div>
        </PlayerProvider>
      </PlaylistProvider>
    </AuthProvider>
  );
}
