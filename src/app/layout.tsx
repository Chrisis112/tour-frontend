'use client';

import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import { I18nextProvider } from 'react-i18next';
import { getI18nInstance } from '../i18n';
import type { i18n as I18nType } from 'i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [i18nInstance, setI18nInstance] = useState<I18nType | null>(null);

  useEffect(() => {
    async function init() {
      const instance = await getI18nInstance();
      setI18nInstance(instance ?? null); // coerce undefined to null
    }
    init();
  }, []);

  // Пока i18n не инициализирован — можно показать простой лейаут без перевода,
  // либо какой-то загрузочный экран
  if (!i18nInstance) {
    return (
      <html lang="ru">
        <body>
          <div>Loading i18n...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang={i18nInstance.language || 'ru'}>
      <body>
        <I18nextProvider i18n={i18nInstance}>
          <Header />
          <main className="min-h-screen bg-gray-50">{children}</main>
          <Footer />
        </I18nextProvider>
      </body>
    </html>
  );
}
