"use client";

import React, { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import DropdownMenu, { DropdownMenuItem } from './DropdownMenu';
import AddToPlaylistModal from './AddToPlaylistModal';

export default function TrackContextMenu({ track, customButton }: { track: any, customButton?: React.ReactNode }) {
  const { addToQueue } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();
  
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const liked = isLiked(track.id);

  const menuItems: DropdownMenuItem[] = [
    {
      label: 'أضف إلى قائمة الانتظار',
      onClick: () => {
        addToQueue(track);
        // Optional: show a toast here if we had a global toast context, 
        // but adding to queue is handled gracefully by PlayerContext.
      },
      rightIcon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      )
    },
    {
      label: 'أضف إلى قائمة تشغيل',
      onClick: () => setShowPlaylistModal(true),
      rightIcon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      )
    },
    { type: 'divider' },
    {
      label: liked ? 'إزالة من المفضلة' : 'حفظ في المفضلة',
      onClick: () => toggleLike(track),
      rightIcon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#1ed760' : 'none'} stroke={liked ? '#1ed760' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      )
    }
  ];

  const defaultButton = (
    <div style={{ color: '#b3b3b3', padding: '8px' }} className="track-context-btn">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
    </div>
  );

  return (
    <>
      <DropdownMenu 
        buttonContent={customButton || defaultButton} 
        items={menuItems} 
        menuStyle={{ minWidth: '220px' }}
      />
      {showPlaylistModal && (
        <AddToPlaylistModal 
          track={track} 
          onClose={() => setShowPlaylistModal(false)} 
        />
      )}
    </>
  );
}
