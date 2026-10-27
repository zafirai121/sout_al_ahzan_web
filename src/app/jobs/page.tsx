"use client";

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { InfoHero, InfoPage, MessageForm } from '@/components/info/Info';

const JOBS = [
  {
    id: 'frontend-dev',
    title: 'مطور واجهات أمامية (Frontend Developer)',
    type: 'دوام كامل، عن بعد',
    desc: 'نبحث عن مطور React / Next.js مبدع للانضمام إلى فريقنا وتطوير واجهات منصة صوت الأحزان.',
  },
  {
    id: 'content-manager',
    title: 'مدير محتوى إسلامي',
    type: 'دوام جزئي',
    desc: 'نبحث عن شخص مطلع على القصائد واللطميات الحسينية لإدارة وتنظيم المحتوى الصوتي والتواصل مع المنشدين.',
  },
  {
    id: 'audio-engineer',
    title: 'مهندس صوت',
    type: 'عمل حر (Freelance)',
    desc: 'مهندس صوت محترف لتحسين جودة التسجيلات القديمة وتصفية المقاطع الصوتية الحصرية للمنصة.',
  },
];

export default function JobsPage() {
  const [job, setJob] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  // A native dialog: it keeps the keyboard inside and closes with Escape
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (job && !d.open) d.showModal();
    if (!job && d.open) d.close();
  }, [job]);

  return (
    <InfoPage>
      <InfoHero
        title="انضم لفريقنا"
        lead="نحن نبحث دائماً عن المبدعين والمبرمجين ومهندسي الصوت الشغوفين للمساهمة في بناء أفضل تجربة استماع لمستمعي صوت الأحزان أينما كانوا."
      />

      <ul className="info-jobs">
        {JOBS.map(j => (
          <li key={j.id} className="info-job">
            <div>
              <h2 className="info-card-title">{j.title}</h2>
              <span className="info-chip">{j.type}</span>
              <p className="info-card-text">{j.desc}</p>
            </div>
            <button type="button" className="btn-gold" onClick={() => setJob(j.title)}>التقديم الآن</button>
          </li>
        ))}
      </ul>

      <dialog ref={dialog} className="info-dialog" onClose={() => setJob(null)} aria-labelledby="job-dialog-title">
        <div className="info-dialog-head">
          <div>
            <h2 id="job-dialog-title" className="info-form-title">التقديم لوظيفة</h2>
            <p className="info-kicker">{job}</p>
          </div>
          <button type="button" className="info-dialog-close" onClick={() => setJob(null)} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>
        {job ? (
          <MessageForm
            key={job}
            kind="job"
            subject={job}
            fields={['url']}
            required={['url']}
            labels={{ url: 'رابط السيرة الذاتية (LinkedIn أو Google Drive)' }}
            submitLabel="إرسال الطلب"
            sentText="تم استلام طلبك بنجاح! سيتم مراجعة سيرتك الذاتية والتواصل معك في حال الترشيح."
          />
        ) : null}
      </dialog>
    </InfoPage>
  );
}
