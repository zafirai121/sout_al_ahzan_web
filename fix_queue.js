const fs = require('fs');
const content = \
"use client";

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylists } from '@/context/PlaylistContext';
import TopBar from '@/components/TopBar';

export default function QueuePage() {
  const { currentTrack, activeQueue, playTrack, isPlaying } = usePlayer();
  const { toggleLike, isLiked } = usePlaylists();

  const currentIndex = activeQueue.findIndex(t => t.id === currentTrack?.id);
  const nextTracks = currentIndex >= 0 ? activeQueue.slice(currentIndex + 1) : [];

  return (
    <div className=\"page-container\" style={{ paddingBottom: '120px' }}>
      <TopBar />
      <div className=\"track-page-content\" style={{ marginTop: '60px', padding: '0 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', color: '#fff' }}>ÿ«»Ê— «· ‘€Ì·</h1>
        
        {currentTrack ? (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#fff' }}>Ì „ «· ‘€Ì· «·¬‰</h2>
            <div className=\"track-list-container\">
              <div 
                className=\"track-list-row track-list-grid-row playing\"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <div className=\"col-index\">
                  <div className={\"audio-visualizer \\"}>
                    <div className=\"bar\"></div>
                    <div className=\"bar\"></div>
                    <div className=\"bar\"></div>
                    <div className=\"bar\"></div>
                  </div>
                </div>
                <div className=\"col-title\">
                  <div className=\"track-info\">
                    {currentTrack.imageUrl ? (
                      <img src={currentTrack.imageUrl} alt={currentTrack.title} className=\"track-img\" />
                    ) : (
                      <div className=\"track-img-placeholder\"></div>
                    )}
                    <div className=\"track-text\">
                      <div className=\"track-name\" style={{ color: '#1ed760' }}>{currentTrack.title}</div>
                      <div className=\"track-artist\">{currentTrack.artist}</div>
                    </div>
                  </div>
                </div>
                <div className=\"col-album\">{currentTrack.artist}</div>
                <div className=\"col-plays\" style={{ textAlign: 'center' }}>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#b3b3b3', marginTop: '40px' }}>·« ÌÊÃœ „ﬁÿ⁄ Ì⁄„· Õ«·Ì«</div>
        )}

        {nextTracks.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#fff' }}>«· «·Ì ›Ì «·ÿ«»Ê—</h2>
            <div className=\"track-list-container\">
              <div className=\"track-list-header track-list-grid-row\">
                <div className=\"col-index\">#</div>
                <div className=\"col-title\">«·⁄‰Ê«‰</div>
                <div className=\"col-album\">«·—«œÊœ</div>
                <div className=\"col-plays\" style={{ textAlign: 'center' }}></div>
              </div>
              
              {nextTracks.map((track, index) => (
                <div 
                  key={\"\-\\"} 
                  className=\"track-list-row track-list-grid-row\"
                  onClick={() => playTrack(track)}
                >
                  <div className=\"col-index\">{index + 1}</div>
                  <div className=\"col-title\">
                    <div className=\"track-info\">
                      {track.imageUrl ? (
                        <img src={track.imageUrl} alt={track.title} className=\"track-img\" />
                      ) : (
                        <div className=\"track-img-placeholder\"></div>
                      )}
                      <div className=\"track-text\">
                        <div className=\"track-name\">{track.title}</div>
                        <div className=\"track-artist\">{track.artist}</div>
                      </div>
                    </div>
                  </div>
                  <div className=\"col-album\">{track.artist}</div>
                  <div className=\"col-plays\" style={{ textAlign: 'center' }}>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
\;
fs.writeFileSync('src/app/queue/page.tsx', content, 'utf8');

