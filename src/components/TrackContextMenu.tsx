"use client";

import React, { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import DropdownMenu, { DropdownMenuItem } from './DropdownMenu';
import AddToPlaylistModal from './AddToPlaylistModal';
import { EllipsisVertical, Heart, List, SquarePlus } from 'lucide-react';

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
        <List size={18} />
      )
    },
    {
      label: 'أضف إلى قائمة تشغيل',
      onClick: () => setShowPlaylistModal(true),
      rightIcon: (
        <SquarePlus size={18} />
      )
    },
    { type: 'divider' },
    {
      label: liked ? 'إزالة من المفضلة' : 'حفظ في المفضلة',
      onClick: () => toggleLike(track),
      rightIcon: (
        <Heart size={18} />
      )
    }
  ];

  const defaultButton = (
    <div style={{ color: '#b3b3b3', padding: '8px' }} className="track-context-btn">
      <EllipsisVertical size={24} />
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
