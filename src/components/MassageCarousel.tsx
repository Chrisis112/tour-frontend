'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';

export interface Massage {
  _id: string;
  title: Record<string, string>;
  photoUrl: string;
  description?: Record<string, string>;
}

export default function MassageCarousel({ massages }: { massages: Massage[] }) {
  const { t, i18n } = useTranslation();

  const [start, setStart] = useState(0);
  const [showCount, setShowCount] = useState(4);
  const [containerWidth, setContainerWidth] = useState(0);

  const total = massages.length;

  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem('i18nextLng') || i18n.language || 'en').split('-')[0];
  });

  useEffect(() => {
    const onLanguageChanged = (lng: string) => setCurrentLang(lng.split('-')[0]);
    i18n.on('languageChanged', onLanguageChanged);
    return () => i18n.off('languageChanged', onLanguageChanged);
  }, [i18n]);

  useEffect(() => {
    function updateShowCount() {
      const width = window.innerWidth;
      if (width < 480) setShowCount(1);
      else if (width < 768) setShowCount(2);
      else if (width < 1024) setShowCount(3);
      else setShowCount(4);
      setStart(0);
      setContainerWidth(window.innerWidth);
    }
    updateShowCount();
    window.addEventListener('resize', updateShowCount);
    return () => window.removeEventListener('resize', updateShowCount);
  }, []);

  const prev = () => setStart(s => Math.max(s - 1, 0));
  const next = () => setStart(s => Math.min(s + 1, Math.max(total - showCount, 0)));

  const gap = 16; // px
  const containerPadding = 32; // px (px-4 * 2)

  const cardWidth = Math.min(220, (containerWidth - containerPadding - gap * (showCount - 1)) / showCount);

  function getLocalizedText(field: Record<string, string> | undefined, lang: string): string {
    if (!field) return '';
    const baseLang = lang.toLowerCase().split('-')[0];
    if (field[baseLang] && field[baseLang].trim()) return field[baseLang];
    if (field['en'] && field['en'].trim()) return field['en'];
    for (const key in field) {
      if (field[key] && field[key].trim()) return field[key];
    }
    return '';
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold">{t('carousel_popular_rides', 'Популярные поездки')}</h3>
        <Link 
          href="/services" 
          className="text-indigo-700 hover:underline" 
          aria-label={t('carousel_all_rides_link', 'Ссылка на все виды поездок')}
        >
          {t('carousel_all_rides', 'Все виды поездок')} &rarr;
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={prev}
          disabled={start === 0}
          className="px-3 py-2 rounded-full bg-gray-200 disabled:opacity-50"
          aria-label={t('carousel_prev', 'Предыдущие')}
        >
          &#8592;
        </button>
        <div 
          className="flex overflow-hidden flex-1"
          style={{ maxWidth: "100%" }}
        >
          <div
            className="flex gap-4 transition-transform duration-300 will-change-transform"
            style={{ transform: `translateX(-${start * (cardWidth + gap)}px)` }}
          >
            {massages.map(ms => (
              <Link
                key={ms._id}
                href={`/booking/${ms._id}`}
                className="block cursor-pointer group flex-shrink-0 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col"
                aria-label={t('carousel_ride_link', 'Ссылка на поездку {{title}}', { title: getLocalizedText(ms.title, currentLang) })}
                style={{
                  width: cardWidth,
                  minWidth: cardWidth,
                }}
              >
                <div className="relative h-36 w-full rounded-t-lg overflow-hidden bg-gray-50 shadow">
                  <img
                    src={ms.photoUrl}
                    alt={getLocalizedText(ms.title, currentLang)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="flex flex-col flex-grow p-3">
                  <h4 className="text-center font-semibold mb-1 truncate" title={getLocalizedText(ms.title, currentLang)}>
                    {getLocalizedText(ms.title, currentLang)}
                  </h4>
                  {ms.description && (
                    <p className="text-xs text-gray-600 text-center line-clamp-3" style={{ minHeight: "3.6em" }} title={getLocalizedText(ms.description, currentLang)}>
                      {getLocalizedText(ms.description, currentLang)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={next}
          disabled={start >= total - showCount || total <= showCount}
          className="px-3 py-2 rounded-full bg-gray-200 disabled:opacity-50"
          aria-label={t('carousel_next', 'Следующие')}
        >
          &#8594;
        </button>
      </div>
    </div>
  );
}
