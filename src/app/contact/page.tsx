"use client";

import React, { useState } from 'react';

export default function ContactPage() {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="الاسم الكامل" style={{ flex: '1', minWidth: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
                <input type="email" placeholder="البريد الإلكتروني" style={{ flex: '1', minWidth: '150px', padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
              </div>
              <input type="text" placeholder="الموضوع" style={{ padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '16px' }} />
              <textarea placeholder="اكتب رسالتك هنا..." rows={6} value={msg} onChange={(e) => setMsg(e.target.value)} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', resize: 'vertical', fontSize: '16px', fontFamily: 'inherit' }}></textarea>
              <button onClick={() => setSent(true)} style={{ padding: '16px', borderRadius: '32px', border: 'none', background: '#F05B28', color: '#fff', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', transition: '0.2s', marginTop: '8px' }}>
                إرسال الرسالة
              </button>
            </div>
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
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="#" style={{ padding: '10px 20px', backgroundColor: '#333', color: '#fff', borderRadius: '24px', textDecoration: 'none', fontSize: '14px', transition: '0.2s' }}>تويتر / X</a>
              <a href="#" style={{ padding: '10px 20px', backgroundColor: '#333', color: '#fff', borderRadius: '24px', textDecoration: 'none', fontSize: '14px', transition: '0.2s' }}>انستجرام</a>
              <a href="#" style={{ padding: '10px 20px', backgroundColor: '#333', color: '#fff', borderRadius: '24px', textDecoration: 'none', fontSize: '14px', transition: '0.2s' }}>تليجرام</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
