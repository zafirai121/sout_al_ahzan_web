"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ownerPost } from '@/lib/release_settings';
import { readableTitle } from '@/utils/data_mapper';
import { countOf, LISTENS } from '@/utils/plural';
import { sameRecording, secondsOf } from '../../../cloudflare/recordings.js';

type Candidate = { id: number; title: string; duration: string; listens: number };
type Asked = { remove: number; keep: number; title: string };
const SHOWN = 8;
const PAGE = 1000;

/**
 * In the track editor: the reciter's tracks as long as this one, any of which
 * may be the same recording uploaded again. The owner keeps one of the two;
 * the other goes, its likes, listens and places in playlists to the one kept
 * (functions/api/admin/copy.js).
 */
export default function CopyFinder({ id, reciterId, reciterName, duration }: {
  id: number;
  reciterId: number | string | null | undefined;
  reciterName: string;
  duration: string | null | undefined;
}) {
  const router = useRouter();
  const [found, setFound] = useState<Candidate[] | null>(null);
  const [asked, setAsked] = useState<Asked | null>(null);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<{ text: string; error?: boolean } | null>(null);
  const length = secondsOf(duration);

  useEffect(() => {
    if (!reciterId || !length) return;
    let live = true;
    (async () => {
      const all: Candidate[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase.from('audio_library').select('id,title,duration,listen_count')
          .eq('reciter_id', reciterId).neq('id', id).order('id').range(from, from + PAGE - 1);
        if (error) throw error;
        for (const t of data ?? []) {
          if (sameRecording(duration, t.duration)) all.push({ id: t.id, title: readableTitle(t.title || ''), duration: t.duration, listens: t.listen_count || 0 });
        }
        if ((data ?? []).length < PAGE) break;
      }
      const near = (t: Candidate) => Math.abs((secondsOf(t.duration) ?? 0) - length);
      if (live) setFound(all.sort((a, b) => near(a) - near(b)).slice(0, SHOWN));
    })().catch(() => { if (live) setFound([]); });
    return () => { live = false; };
  }, [id, reciterId, duration, length]);

  const remove = async () => {
    if (!asked) return;
    setBusy(true);
    setSaid(null);
    const result = await ownerPost('/api/admin/copy', { id: asked.remove, keep: asked.keep });
    setBusy(false);
    if ('error' in result) return setSaid({ text: result.error, error: true });
    if (asked.remove === id) {
      router.push(`/track?id=${asked.keep}`);
      return;
    }
    setFound(list => (list ?? []).filter(t => t.id !== asked.remove));
    setSaid({ text: `حُذفت «${asked.title}»، وبقي هذا المقطع.` });
    setAsked(null);
  };

  if (!reciterId || !length) return null;

  return (
    <section className="rel-part" aria-labelledby="trk-copies">
      <h3 id="trk-copies">هل رُفع مرتين؟</h3>
      {found === null ? (
        <p className="rel-note">جارٍ البحث في مقاطع {reciterName} عن تسجيل بالطول نفسه…</p>
      ) : found.length === 0 ? (
        <p className="rel-note">ليس لـ{reciterName} مقطع آخر بطول هذا المقطع، فلا نسخة ثانية له.</p>
      ) : (
        <>
          <p className="rel-note">
            مقاطع لـ{reciterName} بطول هذا المقطع تقريباً. إن كان أحدها التسجيل نفسه فاحذف إحدى النسختين: تنتقل إعجاباتها واستماعاتها ومكانها في القوائم إلى الباقية.
          </p>
          {asked ? (
            <div className="rec-confirm" role="alertdialog" aria-labelledby="trk-copy-confirm">
              <p id="trk-copy-confirm">تُحذف «{asked.title}» مع ملفها الصوتي، وتُحفظ نسخة احتياطية منها. أأحذفها؟</p>
              <div className="rel-row">
                <button type="button" className="rel-btn" onClick={remove} disabled={busy}>{busy ? 'جارٍ الحذف…' : 'نعم، احذفها'}</button>
                <button type="button" className="rel-link" onClick={() => setAsked(null)} disabled={busy}>إلغاء</button>
              </div>
            </div>
          ) : (
            <ul className="rel-tracks">
              {found.map(t => (
                <li key={t.id} className="rel-track trk-copy">
                  <span className="rel-track-title">
                    {t.title}
                    <small><span dir="ltr">{t.duration}</span> • {countOf(t.listens, LISTENS)}</small>
                  </span>
                  <span className="trk-copy-actions">
                    <button type="button" className="rel-btn" onClick={() => setAsked({ remove: t.id, keep: id, title: t.title })}>أبقِ هذا واحذف تلك</button>
                    <button type="button" className="rel-link" onClick={() => setAsked({ remove: id, keep: t.id, title: 'هذا المقطع' })}>احذف هذا وأبقِ تلك</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {said ? <p className={`rel-status${said.error ? ' is-error' : ''}`} role={said.error ? 'alert' : 'status'}>{said.text}</p> : null}
    </section>
  );
}
