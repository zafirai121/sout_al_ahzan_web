"use client";

import React from 'react';

export default function PremiumPage() {
  return (
    <div style={{ padding: '60px 40px', color: '#fff', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '16px' }}>احصل على تجربة استماع بلا حدود</h1>
      <p style={{ fontSize: '18px', marginBottom: '48px' }}>اشترك في باقات Premium واستمتع بميزات حصرية، جودة صوت أعلى، واستماع بدون إعلانات نهائياً.</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Basic Plan */}
        <div style={{ width: '300px', backgroundColor: '#242424', borderRadius: '12px', padding: '32px', textAlign: 'right', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <span style={{ backgroundColor: '#fff', color: '#000', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', alignSelf: 'flex-start', marginBottom: '16px' }}>الأكثر شعبية</span>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>فردي (Individual)</h2>
          <p style={{ fontSize: '16px', color: '#b3b3b3', margin: '0 0 24px 0' }}>1 حساب</p>
          <hr style={{ border: 'none', height: '1px', backgroundColor: '#3e3e3e', marginBottom: '24px' }} />
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', flex: 1 }}>
            <li style={{ marginBottom: '12px', display: 'flex', gap: '12px' }}>✔️ <span>استماع بدون إعلانات</span></li>
            <li style={{ marginBottom: '12px', display: 'flex', gap: '12px' }}>✔️ <span>جودة صوت عالية جداً</span></li>
            <li style={{ display: 'flex', gap: '12px' }}>✔️ <span>إنشاء قوائم تشغيل غير محدودة</span></li>
          </ul>
          <button style={{ width: '100%', padding: '16px', borderRadius: '32px', border: 'none', background: '#1ed760', color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>الاشتراك الآن (4.99$ / شهر)</button>
        </div>

        {/* Family Plan */}
        <div style={{ width: '300px', backgroundColor: '#242424', borderRadius: '12px', padding: '32px', textAlign: 'right', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <span style={{ backgroundColor: '#f15e6c', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', alignSelf: 'flex-start', marginBottom: '16px' }}>للعائلة</span>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>عائلي (Family)</h2>
          <p style={{ fontSize: '16px', color: '#b3b3b3', margin: '0 0 24px 0' }}>حتى 6 حسابات</p>
          <hr style={{ border: 'none', height: '1px', backgroundColor: '#3e3e3e', marginBottom: '24px' }} />
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', flex: 1 }}>
            <li style={{ marginBottom: '12px', display: 'flex', gap: '12px' }}>✔️ <span>كل ميزات الحساب الفردي</span></li>
            <li style={{ marginBottom: '12px', display: 'flex', gap: '12px' }}>✔️ <span>حسابات مستقلة لكل فرد</span></li>
            <li style={{ display: 'flex', gap: '12px' }}>✔️ <span>ميزات الرقابة العائلية</span></li>
          </ul>
          <button style={{ width: '100%', padding: '16px', borderRadius: '32px', border: 'none', background: '#fff', color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>الاشتراك الآن (7.99$ / شهر)</button>
        </div>

      </div>
    </div>
  );
}
