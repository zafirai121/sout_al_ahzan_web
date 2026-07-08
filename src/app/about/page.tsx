import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'من نحن | صوت الأحزان',
  description: 'تعرف على قصة تأسيس منصة صوت الأحزان ورؤيتنا في نشر الوعي الحسيني وتوفير أفضل تجربة استماع للقصائد واللطميات الحسينية.',
};

export default function AboutPage() {
  return (
    <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto', color: '#fff', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '32px', textAlign: 'center', color: '#F05B28' }}>عن صوت الأحزان</h1>
      
      <div style={{ backgroundColor: '#181818', padding: '40px', borderRadius: '16px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#fff' }}>رسالتنا ورؤيتنا</h2>
        <p style={{ fontSize: '18px', color: '#b3b3b3', marginBottom: '16px' }}>
          منصة "صوت الأحزان" هي الملاذ الأول للاستماع المباشر وبجودة فائقة لكل ما يخص الشعائر الحسينية. نحن نؤمن بأن الكلمة الصادقة واللحن الشجي يتركان أثراً عميقاً في القلوب، لذلك حرصنا على توفير مكتبة ضخمة تضم آلاف القصائد واللطميات، والأدعية، والمواليد.
        </p>
        <p style={{ fontSize: '18px', color: '#b3b3b3' }}>
          رؤيتنا هي أن نكون الجسر الذي يربط محبي أهل البيت (عليهم السلام) بأصوات الرواديد والمنشدين من مختلف أنحاء العالم، في منصة عصرية تحترم خصوصيتهم وتوفر لهم أفضل تجربة مستخدم بدون انقطاع أو إعلانات مزعجة.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '16px', color: '#1ed760' }}>مكتبة شاملة</h3>
          <p style={{ color: '#b3b3b3' }}>نقدم مجموعة واسعة من التصنيفات التي تلبي جميع الأذواق والمناسبات الدينية طوال العام.</p>
        </div>
        <div style={{ backgroundColor: '#181818', padding: '32px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '16px', color: '#509bf5' }}>جودة استثنائية</h3>
          <p style={{ color: '#b3b3b3' }}>نحرص على توفير أفضل جودة صوتية ممكنة لتعيش اللحظة بكل تفاصيلها.</p>
        </div>
      </div>
    </div>
  );
}
