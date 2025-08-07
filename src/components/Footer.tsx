import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
     <footer className="bg-gray-200 py-4 mt-8 text-center text-gray-600">
      <div className="flex justify-center gap-6 mb-2">
        <a
          href="https://www.facebook.com/share/16zPFUdza6/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="inline-block"
        >
          {/* Facebook image icon */}
          <img
            src="/facebook.png"
            alt="Facebook"
            width="24"
            height="24"
            style={{ borderRadius: '5px' }}
          />
        </a>
        <a
          href="https://instagram.com/mytours.ee"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="inline-block"
        >
          {/* Instagram image */}
          <img
            src="/instagram.png"
            alt="Instagram"
            width="24"
            height="24"
            style={{ borderRadius: '5px' }}
          />
        </a>
      </div>
      <div>
        © {new Date().getFullYear()} MyTours. {t('rights', 'All rights reserved')}.
        <Link href="/terms" className="block text-gray-700 underline hover:text-indigo-600 font-medium mt-1">
          {t('terms', 'terms')}
        </Link>
      </div>
    </footer>
  );
}
