import React from 'react';
import Link from 'next/link';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-top">
        <div className="footer-links">
          <div className="footer-column">
            <h4 className="footer-heading">منصة صوت الأحزان</h4>
            <ul className="footer-list">
              <li><Link href="/about">من نحن</Link></li>
              <li><Link href="/contact">اتصل بنا</Link></li>
              <li><Link href="/support">دعم المشروع</Link></li>
              <li><Link href="/jobs">الوظائف</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">للمبدعين</h4>
            <ul className="footer-list">
              <li><Link href="/artists">للروايد والمنشدين</Link></li>
              <li><Link href="/publishers">لوحة الناشرين</Link></li>
              <li><Link href="/developers">المطورين</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">روابط مفيدة</h4>
            <ul className="footer-list">
              <li><Link href="/help">المساعدة والدعم</Link></li>
              <li><Link href="/download">تطبيق الهاتف</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-socials">
          <a href="#" className="social-icon" title="Instagram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a href="#" className="social-icon" title="Twitter">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 4.557a9.83 9.83 0 01-2.828.775 4.932 4.932 0 002.165-2.724 9.864 9.864 0 01-3.127 1.195 4.916 4.916 0 00-8.384 4.482A13.942 13.942 0 011.671 3.149a4.93 4.93 0 001.523 6.574 4.903 4.903 0 01-2.229-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.557z"/>
            </svg>
          </a>
          <a href="#" className="social-icon" title="YouTube">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 00-2.122 2.136C0 8.078 0 12 0 12s0 3.922.501 5.814a3.016 3.016 0 002.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 002.122-2.136C24 15.922 24 12 24 12s0-3.922-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-legal">
          <ul className="legal-list">
            <li><Link href="/legal">قانوني</Link></li>
            <li><Link href="/privacy-center">مركز الخصوصية</Link></li>
            <li><Link href="/privacy-policy">سياسة الخصوصية</Link></li>
            <li><Link href="/cookies">ملفات تعريف الارتباط</Link></li>
            <li><Link href="/ads">حول الإعلانات</Link></li>
          </ul>
        </div>
        <div className="footer-copyright">
          <span>&copy; {new Date().getFullYear()} منصة صوت الأحزان</span>
        </div>
      </div>
    </footer>
  );
}
