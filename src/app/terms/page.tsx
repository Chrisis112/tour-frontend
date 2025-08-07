'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TermsPage() {
  const { t } = useTranslation();

  function getPoints(key: string): string[] {
    const res = t(key, { returnObjects: true });
    if (Array.isArray(res)) {
      return res.filter((item): item is string => typeof item === 'string');
    }
    return [];
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('title')}</h1>
      <p className="mb-6 text-center text-gray-500">{t('company')}</p>

      {[1, 2, 3, 4, 5].map((section) => (
        <section className="mb-6" key={section}>
          <h2 className="text-xl font-semibold mb-2">{t(`sections.${section}.heading`)}</h2>
          <ul className="list-disc ml-6 space-y-1">
            {getPoints(`sections.${section}.points`).map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('sections.6.heading')}</h2>
        <p>{t('sections.6.text')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('sections.7.heading')}</h2>
        <ul className="list-disc ml-6 space-y-1">
          {getPoints('sections.7.points').map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('sections.8.heading')}</h2>
        <div className="ml-6">
          <div>{t('sections.8.contact.company')}</div>
          <div>{t('sections.8.contact.email')}</div>
          <div>{t('sections.8.contact.phone')}</div>
        </div>
      </section>
        <section className="mb-6">
  <h2 className="text-xl font-semibold mb-2">{t('sections.9.heading')}</h2>
  <ul className="list-disc ml-6 space-y-1">
    {getPoints('sections.9.points').map((point, i) => (
      <li key={i}>{point}</li>
    ))}
  </ul>
</section>
    </main>
  );
}
