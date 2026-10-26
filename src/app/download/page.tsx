"use client";

import React from 'react';
import { Download, Globe } from 'lucide-react';
import { InfoHero, InfoPage } from '@/components/info/Info';

// The Android app's own page (it shows the latest version and its file), and
// the web app that phones are sent to
const ANDROID_PAGE = 'https://zafirai121.github.io/sawt-alahzan-app/android/';
const WEB_APP = 'https://zafirai121.github.io/sawt-alahzan-app/';

export default function DownloadPage() {
  return (
    <InfoPage>
      <InfoHero
        title="استمع أينما كنت"
        lead="افتح تطبيق صوت الأحزان على هاتفك واستمتع بأفضل تجربة استماع لقصائدك المفضلة."
      />

      <div className="info-apps">
        <a href={ANDROID_PAGE} target="_blank" rel="noopener noreferrer" className="info-app info-app--main">
          <span className="info-card-icon" aria-hidden="true"><Download size={24} /></span>
          <span className="info-app-name">تطبيق أندرويد</span>
          <span className="info-card-text">نزّل التطبيق على هاتفك: يعمل دون متصفح، ويتحدّث من داخله.</span>
          <span className="btn-gold info-app-button">تنزيل التطبيق</span>
        </a>
        <a href={WEB_APP} target="_blank" rel="noopener noreferrer" className="info-app">
          <span className="info-card-icon" aria-hidden="true"><Globe size={24} /></span>
          <span className="info-app-name">تطبيق الويب</span>
          <span className="info-card-text">يعمل في متصفح أي هاتف، أندرويد وآيفون، دون تنزيل.</span>
          <span className="btn-outline info-app-button">افتح التطبيق</span>
        </a>
      </div>
    </InfoPage>
  );
}
