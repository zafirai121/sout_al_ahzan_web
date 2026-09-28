"use client";

import React, { useState } from 'react';
import { Loader, X } from 'lucide-react';
import { sendContactMessage, SEND_ERROR } from '@/utils/contact';

export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cvLink, setCvLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const jobs = [
    {
      id: "frontend-dev",
      title: "مطور واجهات أمامية (Frontend Developer)",
      type: "دوام كامل - عن بعد",
      desc: "نبحث عن مطور React / Next.js مبدع للانضمام إلى فريقنا وتطوير واجهات منصة صوت الأحزان."
    },
    {
      id: "content-manager",
      title: "مدير محتوى إسلامي",
      type: "دوام جزئي",
      desc: "نبحث عن شخص مطلع على القصائد واللطميات الحسينية لإدارة وتنظيم المحتوى الصوتي والتواصل مع المنشدين."
    },
    {
      id: "audio-engineer",
      title: "مهندس صوت",
      type: "عمل حر (Freelance)",
      desc: "مهندس صوت محترف لتحسين جودة التسجيلات القديمة وتصفية المقاطع الصوتية الحصرية للمنصة."
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !cvLink) return;
    setIsSubmitting(true);
    try {
      await sendContactMessage({ kind: 'job', name, email, subject: selectedJob ?? '', message: cvLink });
      setSent(true);
    } catch {
      alert(SEND_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedJob(null);
    setSent(false);
    setName("");
    setEmail("");
    setCvLink("");
  };

  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff', position: 'relative' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#F05B28' }}>انضم لفريقنا</h1>
      <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '18px', marginBottom: '48px', lineHeight: '1.8' }}>
        نحن نبحث دائماً عن المبدعين والمبرمجين ومهندسي الصوت الشغوفين للمساهمة في بناء أفضل تجربة استماع لملايين المستخدمين حول العالم.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {jobs.map((job) => (
          <div key={job.id} style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>{job.title}</h3>
              <span style={{ display: 'inline-block', padding: '4px 12px', backgroundColor: '#333', borderRadius: '12px', fontSize: '14px', marginBottom: '16px', color: '#1ed760' }}>
                {job.type}
              </span>
              <p style={{ color: '#b3b3b3', lineHeight: '1.6', maxWidth: '500px' }}>{job.desc}</p>
            </div>
            <button 
              onClick={() => setSelectedJob(job.title)}
              style={{ padding: '12px 32px', backgroundColor: '#fff', color: '#000', borderRadius: '32px', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              التقديم الآن
            </button>
          </div>
        ))}
      </div>

      {selectedJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#282828', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>التقديم لوظيفة</h2>
            <p style={{ color: '#1ed760', marginBottom: '24px', fontWeight: 'bold' }}>{selectedJob}</p>

            {sent ? (
              <div style={{ backgroundColor: 'rgba(30, 215, 96, 0.1)', border: '1px solid #1ed760', color: '#1ed760', padding: '24px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}>
                تم استلام طلبك بنجاح! سيتم مراجعة سيرتك الذاتية والتواصل معك في حال الترشيح.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#b3b3b3' }}>الاسم الكامل</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #555', background: '#333', color: '#fff', fontSize: '16px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#b3b3b3' }}>البريد الإلكتروني</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #555', background: '#333', color: '#fff', fontSize: '16px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#b3b3b3' }}>رابط السيرة الذاتية (LinkedIn أو Google Drive)</label>
                  <input type="url" required value={cvLink} onChange={(e) => setCvLink(e.target.value)} disabled={isSubmitting} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #555', background: '#333', color: '#fff', fontSize: '16px' }} />
                </div>
                <button type="submit" disabled={isSubmitting} style={{ padding: '16px', borderRadius: '32px', border: 'none', background: isSubmitting ? '#555' : '#F05B28', color: '#fff', fontWeight: 'bold', fontSize: '18px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: '0.2s', marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {isSubmitting ? (
                    <>
                      <Loader size={20} className="fa-spin" />
                      جاري الإرسال...
                    </>
                  ) : 'إرسال الطلب'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
