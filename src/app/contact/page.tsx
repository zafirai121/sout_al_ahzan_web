"use client";

import React from 'react';
import { Mail, Mic } from 'lucide-react';
import { InfoCard, InfoHero, InfoPage, MessageForm } from '@/components/info/Info';

const SOCIAL = [
  ['إنستغرام', 'https://www.instagram.com/sout_alahzan?igsh=MTJvaXh4bnY3a2xrdQ=='],
  ['تيليغرام', 'https://t.me/Zafir1199'],
  ['فيسبوك', 'https://www.facebook.com/share/1D1sfZV93E/'],
] as const;

export default function ContactPage() {
  return (
    <InfoPage>
      <InfoHero
        title="اتصل بنا"
        lead="نحن هنا دائماً من أجلك. أرسل لنا رسالة وسنقوم بالرد عليك في أقرب وقت ممكن."
      />

      <div className="info-split">
        <MessageForm
          kind="contact"
          title="أرسل رسالة مباشرة"
          fields={['subject', 'message']}
          required={['subject', 'message']}
          labels={{ message: 'رسالتك' }}
          sentText="تم إرسال رسالتك بنجاح! شكراً لتواصلك معنا، سنقوم بالرد عليك قريباً."
        />

        <div className="info-aside">
          <InfoCard icon={<Mail size={22} />} title="البريد الإلكتروني العام">
            <a href="mailto:info@soutalahzan.com" dir="ltr">info@soutalahzan.com</a>
          </InfoCard>
          <InfoCard icon={<Mic size={22} />} title="دعم الرواديد والناشرين">
            <a href="mailto:creators@soutalahzan.com" dir="ltr">creators@soutalahzan.com</a>
          </InfoCard>
          <InfoCard title="تابعنا">
            <span className="info-links">
              {SOCIAL.map(([name, href]) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer">{name}</a>
              ))}
            </span>
          </InfoCard>
        </div>
      </div>
    </InfoPage>
  );
}
