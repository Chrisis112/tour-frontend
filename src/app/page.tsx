'use client';

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import MassageCarousel, { Massage } from '../components/MassageCarousel';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [massages, setMassages] = useState<Massage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/services/public`);
        if (Array.isArray(res.data)) {
          setMassages(res.data);
          setError(null);
        } else {
          setMassages([]);
          console.warn('Unexpected response format:', res.data);
        }
      } catch {
        setError(t('error_loading_services', 'Ошибка загрузки услуг.'));
        setMassages([]);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [t]);

  const pageTitle = t('homepage.title', 'Онлайн платформа для бронирования велорикш в Европе');
  const pageDescription = t(
    'homepage.description',
    'Мы соединяем клиентов и квалифицированных водителей рикш. Забронируйте услугу онлайн в удобное время у проверенного водителя вашего города!'
  );
  const pageUrl = typeof window !== 'undefined' ? window.location.href : 'https://mytours.ee/'; // fallback на ваш основной URL
  const imageUrl = 'https://oazys-food-ordering.s3.eu-north-1.amazonaws.com/services/servi…'; // Подставьте актуальный URL изображения сайта или логотипа

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4 py-12 text-lg">
        {t('loading', 'Загрузка...')}
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4 py-12 text-red-600">
        {error}
      </main>
    );
  }

  return (
    <>
      <Head>
        {/* Основные мета-теги для SEO */}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta httpEquiv="Content-Language" content={i18n.language || 'ru'} />

        {/* Open Graph для Facebook, Instagram и других соцсетей */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:alt" content={pageTitle} />
        <meta property="og:locale" content={i18n.language || 'ru_RU'} />
        {/* Страницы Facebook, Instagram и тд – для доверия */}
        <meta property="fb:app_id" content="your_facebook_app_id" /> {/* Если есть Facebook App ID */}

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:site" content="@mytours_ee" />
        <meta name="twitter:creator" content="@mytours_ee" />

        {/* По желанию: canonical ссылка */}
        <link rel="canonical" href={pageUrl} />
      </Head>

      <main className="flex flex-col gap-10 items-center px-4 py-12 max-w-7xl mx-auto">
        {/* Секция описания, адаптивная и удобочитаемая */}
        <section className="max-w-2xl text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{pageTitle}</h1>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">{pageDescription}</p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center sm:justify-start items-center mb-6">
            <div className="bg-indigo-100 p-4 rounded-lg max-w-xs flex-1 sm:flex-none">
              <strong>{t('homepage.for_clients_title', 'Клиентам:')}</strong>
              <br />
              <span className="text-gray-700 text-sm">
                {t(
                  'homepage.for_clients_description',
                  'Найдите подходящего водителя, посмотрите его документ обслуживания, опыт и отзывы — и оформите запись быстро и безопасно.'
                )}
              </span>
            </div>
            <div className="bg-green-100 p-4 rounded-lg max-w-xs flex-1 sm:flex-none">
              <strong>{t('homepage.for_drivers_title', 'Водителям:')}</strong>
              <br />
              <span className="text-gray-700 text-sm">
                {t(
                  'homepage.for_drivers_description',
                  'Добавляйте услуги и документы, управляйте расписанием и принимайте заказы от новых клиентов.'
                )}
              </span>
            </div>
          </div>
          <Link
            href="/services"
            className="inline-block px-6 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 transition"
            aria-label={t('homepage.view_all_services', 'Смотреть все услуги')}
          >
            {t('homepage.view_all_services', 'Смотреть все услуги')} &rarr;
          </Link>
        </section>

        {/* Карусель */}
        <section className="w-full max-w-4xl">
          {massages.length > 0 ? (
            <MassageCarousel massages={massages} />
          ) : (
            <p className="text-gray-500 text-center">{t('homepage.no_rides_loaded', 'Поездки пока не загружены.')}</p>
          )}
        </section>

        <section className="max-w-2xl text-center bg-yellow-50 p-8 rounded-xl shadow-lg border border-yellow-300 w-full">
          <p className="text-lg text-gray-900 font-medium leading-relaxed">
            {t('homepage1.become_provider_intro', 'Желаете стать исполнителем и получать заказы прямо на телефон?')}
            <br />
            {t('homepage1.become_provider_contact', 'Свяжитесь с нами по телефону')}{' '}
            <a
              href="tel:+3725561195"
              className="text-yellow-700 font-semibold underline hover:text-yellow-900 transition-colors"
              aria-label={t('homepage1.call_us', 'Позвонить нам')}
            >
              +372 556 1195
            </a>{' '}
            {t('homepage1.or_email', 'или по емайлу ')}{' '}
            <a
              href="mailto:info@mytours.ee"
              className="text-yellow-700 font-semibold underline hover:text-yellow-900 transition-colors"
              aria-label={t('homepage1.email_us', 'Отправить email')}
            >
              info@mytours.ee
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
