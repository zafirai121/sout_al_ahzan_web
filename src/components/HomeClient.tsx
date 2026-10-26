"use client";

import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { DbAudioTrack, DbReciter } from '@/types';
import { fetchHomeData } from '@/lib/home_data';
import { usePlaylists } from '@/context/PlaylistContext';
import OccasionBanner from '@/components/home/OccasionBanner';
import { CategoryTiles, RecentTracks, ReciterCard, Shelf, TrackCard } from '@/components/home/HomeParts';
import { CategoryShelf, NewReciters, ReciterOfTheDay } from '@/components/home/HomeExtras';
import '@/components/home/home.css';

interface HomeClientProps {
  poems: DbAudioTrack[];
  popularPoems: DbAudioTrack[];
  reciters: DbReciter[];
  fridayTracks: DbAudioTrack[];
}

const dailyMessage = () => {
  switch (new Date().getDay()) {
    case 0: return "بداية أسبوع مباركة، وقت للروحانية";
    case 1: return "يوم الإثنين، تجديد العهد والنية";
    case 2: return "الثلاثاء، سكينة وطمأنينة";
    case 3: return "منتصف الأسبوع، استمر في العطاء الروحي";
    case 4: return "ليلة الجمعة تقترب، وقت للخشوع والدعاء";
    case 5: return "إنه الجمعة، يوم الدعاء وقراءة القرآن";
    case 6: return "يوم السبت، راحة وسلام داخلي";
    default: return "يوم مبارك";
  }
};

// Every section says what it is: no "made for you" or "mix" over lists that
// are the same for everyone. What is the listener's own (recent tracks, likes)
// comes from their browser and shows only when there is some.
export default function HomeClient(initialData: HomeClientProps) {
  const { recentTracks } = usePlayer();
  const { likedTracks } = usePlaylists();

  // Build-time data first, then today's data from the database
  const [data, setData] = useState(initialData);
  useEffect(() => {
    fetchHomeData()
      .then(fresh => { if (fresh.poems.length > 0) setData(fresh); })
      .catch(e => console.error('Failed to refresh homepage data:', e));
  }, []);
  const { poems, popularPoems, reciters, fridayTracks } = data;

  // The page is built once at deploy time, on the server's day; the visitor's
  // day is only known in the browser. Set after mount so both render the same
  // HTML (otherwise React error #418 on every visit).
  const [dayLine, setDayLine] = useState('');
  useEffect(() => setDayLine(dailyMessage()), []);

  return (
    <div className="content-inner home">
      <h1 className="sr-only">صوت الأحزان: لطميات وقصائد حسينية بصوت أشهر الرواديد</h1>

      <OccasionBanner />

      <CategoryTiles />

      {recentTracks.length > 0 ? <RecentTracks tracks={recentTracks} /> : null}

      {poems.length > 0 ? (
        <Shelf title="أحدث الإصدارات" href="/explore?type=recent">
          {poems.slice(0, 20).map(item => <TrackCard key={item.id} item={item} />)}
        </Shelf>
      ) : null}

      <ReciterOfTheDay />

      {reciters.length > 0 ? (
        <Shelf title="الرواديد" href="/explore?type=reciters">
          {reciters.map(item => <ReciterCard key={item.id} item={item} />)}
        </Shelf>
      ) : null}

      {popularPoems.length > 0 ? (
        <Shelf title="الأكثر استماعاً" href="/explore?type=popular">
          {popularPoems.map(item => <TrackCard key={item.id} item={item} />)}
        </Shelf>
      ) : null}

      <CategoryShelf title="مواليد وأفراح" subtitle="من المواليد والأناشيد، الأكثر استماعاً" href="/category/muwalid" codes={['muwalid', 'nasheed']} />

      {fridayTracks.length > 0 ? (
        <Shelf title="أدعية ومناجاة" subtitle={dayLine || undefined} href="/category/dua">
          {fridayTracks.map(item => <TrackCard key={item.id} item={item} />)}
        </Shelf>
      ) : null}

      <CategoryShelf title="زيارات" href="/category/ziyarat" codes={['ziyarat']} />

      <NewReciters />

      {likedTracks.length > 0 ? (
        <Shelf title="إعجاباتك" href="/playlists?id=likes">
          {likedTracks.slice(-12).reverse().map(item => <TrackCard key={item.id} item={item} />)}
        </Shelf>
      ) : null}
    </div>
  );
}
