"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isOwner } from '@/lib/release_settings';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import DropdownMenu, { DropdownMenuItem } from './DropdownMenu';
import AddToPlaylistModal from './AddToPlaylistModal';
import { EllipsisVertical, Heart, List, Pencil, SquarePlus } from 'lucide-react';

/** `extra`: what the page adds at the end ("إزالة من هذه القائمة" in a playlist) */
export default function TrackContextMenu({ track, customButton, extra }: { track: any, customButton?: React.ReactNode, extra?: DropdownMenuItem[] }) {
  const { addToQueue } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();
  
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const liked = isLiked(track.id);
  // The site's owner edits any track, on its page
  const router = useRouter();
  const owner = isOwner(useAuth().user);

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
    },
    ...(extra?.length ? [{ type: 'divider' } as const, ...extra] : []),
    ...(owner && track.id ? [
      { type: 'divider' } as const,
      { label: 'تعديل المقطع', onClick: () => router.push(`/track?id=${track.id}&edit=1`), rightIcon: <Pencil size={18} /> },
    ] : []),
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
        label={`خيارات ${track.title || 'المقطع'}`}
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
