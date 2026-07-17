"use client";

import React, { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !subject || !msg) {
      setError("يرجى تعبئة جميع الحقول المطلوبة.");
      return;
    }

    if (!email.includes('@')) {
      setError("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div style={{ padding: '60px 40px', maxWidth: '1000px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#F05B28' }}>اتصل بنا</h1>
      <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '18px', marginBottom: '48px', lineHeight: '1.6' }}>
        نحن هنا دائماً من أجلك. أرسل لنا رسالة وسنقوم بالرد عليك في أقرب وقت ممكن.
      </p>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        {/* Contact Form */}
        <div style={{ flex: '1.5', minWidth: '320px', backgroundColor: '#181818', padding: '40px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>أرسل رسالة مباشرة</h2>
          
          {sent ? (
            <div style={{ backgroundColor: 'rgba(30, 215, 96, 0.1)', border: '1px solid #1ed760', color: '#1ed760', padding: '24px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}>
              تم إرسال رسالتك بنجاح! شكراً لتواصلك معنا، سنقوم بالرد عليك قريباً.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div style={{ padding: '12px', backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', color: '#ff4444', borderRadius: '8px' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} style={{ flex: '1', minWidth: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
                <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} style={{ flex: '1', minWidth: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
              </div>
              <input type="text" placeholder="الموضوع" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isSubmitting} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
              <textarea placeholder="اكتب رسالتك هنا..." rows={6} value={msg} onChange={(e) => setMsg(e.target.value)} disabled={isSubmitting} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', resize: 'vertical', fontSize: '16px', fontFamily: 'inherit' }}></textarea>
              <button type="submit" disabled={isSubmitting} style={{ padding: '16px', borderRadius: '32px', border: 'none', background: isSubmitting ? '#555' : '#F05B28', color: '#fff', fontWeight: 'bold', fontSize: '18px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: '0.2s', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                {isSubmitting ? (
                  <>
                    <svg className="fa-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                    جاري الإرسال...
                  </>
                ) : 'إرسال الرسالة'}
              </button>
            </form>
          )}
        </div>

        {/* Contact Info */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#b3b3b3' }}>معلومات التواصل</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <strong style={{ display: 'block', color: '#fff', marginBottom: '4px' }}>البريد الإلكتروني العام:</strong>
                <a href="mailto:info@soutalahzan.com" style={{ color: '#F05B28', textDecoration: 'none' }}>info@soutalahzan.com</a>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#fff', marginBottom: '4px' }}>دعم الناشرين:</strong>
                <a href="mailto:creators@soutalahzan.com" style={{ color: '#F05B28', textDecoration: 'none' }}>creators@soutalahzan.com</a>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#b3b3b3' }}>تابعنا</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <a href="https://www.instagram.com/sout_alahzan?igsh=MTJvaXh4bnY3a2xrdQ==" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '16px', transition: 'color 0.2s' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span>انستجرام</span>
              </a>
              <a href="https://t.me/Zafir1199" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '16px', transition: 'color 0.2s' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.31-.346-.11l-6.4 4.02-2.76-.86c-.6-.188-.612-.6.126-.89l10.814-4.17c.5-.188.948.112.802.923z"/>
                </svg>
                <span>تليجرام</span>
              </a>
              <a href="https://www.facebook.com/share/1D1sfZV93E/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '16px', transition: 'color 0.2s' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0a12 12 0 100 24 12 12 0 000-24zm3.5 7h-1.5c-.8 0-1 .4-1 1v1.5h2.5l-.5 2.5h-2v7h-3v-7h-2v-2.5h2v-2c0-2 1.2-3 3-3h1.5v2.5z"/>
                </svg>
                <span>فيسبوك</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
