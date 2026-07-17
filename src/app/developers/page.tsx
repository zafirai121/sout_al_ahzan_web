"use client";

import React, { useState } from 'react';

export default function DevelopersPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRequestAccess = () => {
    if (apiKey) return;
    setIsLoading(true);
    // Simulate API request to generate key
    setTimeout(() => {
      const newKey = "sk_test_" + crypto.randomUUID().replace(/-/g, '') + "9a8b7c";
      setApiKey(newKey);
      setIsLoading(false);
    }, 1500);
  };

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', color: '#F05B28' }}>بوابة المطورين</h1>
      <p style={{ color: '#b3b3b3', fontSize: '18px', marginBottom: '48px', lineHeight: '1.8' }}>
        استخدم واجهة برمجة التطبيقات (API) الخاصة بنا لدمج مكتبة صوتيات صوت الأحزان في تطبيقاتك ومواقعك. نحن نوفر وصولاً سهلاً وسريعاً لمحتوانا.
      </p>

      <div style={{ backgroundColor: '#181818', padding: '40px', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', fontFamily: 'monospace' }}>Sout Al-Ahzan Web API</h2>
        <p style={{ color: '#b3b3b3', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
          هذه واجهة RESTful API تتيح لك الوصول إلى المحتوى. للوصول إلى الواجهة يجب استخدام مفتاح وصول (API Key).
        </p>

        <div style={{ backgroundColor: '#000', padding: '24px', borderRadius: '8px', fontFamily: 'monospace', color: '#1ed760', marginBottom: '32px', overflowX: 'auto' }}>
          GET /v1/tracks?reciter_id=...<br/>
          Authorization: Bearer YOUR_TOKEN
        </div>

        {!apiKey ? (
          <button 
            onClick={handleRequestAccess}
            disabled={isLoading}
            style={{ padding: '16px 32px', backgroundColor: isLoading ? '#555' : '#333', color: '#fff', borderRadius: '32px', fontWeight: 'bold', fontSize: '16px', border: '1px solid #555', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isLoading ? (
              <>
                <svg className="fa-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                جاري إنشاء المفتاح...
              </>
            ) : 'طلب رمز وصول API'}
          </button>
        ) : (
          <div style={{ padding: '24px', backgroundColor: 'rgba(30, 215, 96, 0.1)', border: '1px solid #1ed760', borderRadius: '8px' }}>
            <h3 style={{ color: '#1ed760', marginBottom: '16px', fontSize: '18px' }}>تم إنشاء مفتاح API بنجاح!</h3>
            <p style={{ color: '#b3b3b3', marginBottom: '16px', fontSize: '14px' }}>يرجى نسخ هذا المفتاح والاحتفاظ به في مكان آمن، لن يظهر مرة أخرى.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                readOnly 
                value={apiKey} 
                style={{ flex: 1, padding: '12px 16px', backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontFamily: 'monospace', fontSize: '14px' }} 
              />
              <button 
                onClick={handleCopy}
                style={{ padding: '0 24px', backgroundColor: '#1ed760', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                {copied ? 'تم النسخ!' : 'نسخ المفتاح'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
