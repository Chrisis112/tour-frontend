'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Head from 'next/head';
import Script from 'next/script';
import { useTranslation } from 'react-i18next';

interface Blog {
  _id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  photoUrl?: string;
  city: string;
  country: string;
  createdAt: string;
}

interface ServiceVariant {
  duration: number;
  price: number;
}

interface Service {
  _id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  photoUrl?: string;
  country?: string;
  city?: string;
  variants: ServiceVariant[];
}

function getLocalizedText(field: Record<string, string> | undefined, lang: string): string {
  if (!field) return '';
  const baseLang = lang.toLowerCase().split('-')[0];
  if (field[baseLang]?.trim()) return field[baseLang];
  if (field['en']?.trim()) return field['en'];
  for (const langKey in field) {
    if (field[langKey]?.trim()) return field[langKey];
  }
  return '';
}

export default function BlogDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en';

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

  const [blog, setBlog] = useState<Blog | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingBlog, setLoadingBlog] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных блога по id
  useEffect(() => {
    if (!id) {
      setError(t('blog_not_found', 'Блог не найден'));
      setLoadingBlog(false);
      return;
    }

    async function fetchBlog() {
      setLoadingBlog(true);
      try {
        const res = await fetch(`${API_URL}/blog/${id}?lang=${currentLang}`);
        if (!res.ok) throw new Error(t('blog_not_found', 'Блог не найден'));
        const data = await res.json();
        setBlog(data);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoadingBlog(false);
      }
    }

    fetchBlog();
  }, [id, API_URL, currentLang, t]);

  // Загрузка услуг по городу блога
  useEffect(() => {
    if (!blog?.city) {
      setServices([]);
      setLoadingServices(false);
      return;
    }

    async function fetchServices() {
      setLoadingServices(true);
      try {
        const cityEncoded = blog?.city ? encodeURIComponent(blog.city) : '';
        const res = await fetch(`${API_URL}/services/public?city=${cityEncoded}&lang=${currentLang}`);
        if (!res.ok) throw new Error(t('services_error', 'Ошибка при загрузке услуг'));
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    }

    fetchServices();
  }, [blog?.city, API_URL, currentLang, t]);

  // Обработка загрузки
  if (loadingBlog) {
    return <div className="p-4 text-center">{t('loading', 'Загрузка...')}</div>;
  }

  // Обработка ошибок
  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {t('go_back', 'Назад')}
        </button>
      </div>
    );
  }

  // Если блог пуст
  if (!blog) {
    return (
      <div className="p-4 text-center">
        <p>{t('blog_not_found', 'Блог не найден')}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {t('go_back', 'Назад')}
        </button>
      </div>
    );
  }

  // Подготовка JSON-LD структурированных данных
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: getLocalizedText(blog.title, currentLang),
    description: getLocalizedText(blog.description, currentLang),
    datePublished: blog.createdAt,
    author: {
      '@type': 'Person',
      name: 'Автор сайта',
    },
    image: blog.photoUrl || undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Ваша организация или сайт',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL || ''}/blog/${id}`,
    },
  };

  return (
    <>
      <Head>
        <title>{getLocalizedText(blog.title, currentLang)}</title>
        <meta
          name="description"
          content={getLocalizedText(blog.description, currentLang).slice(0, 160)}
        />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/blog/${id}`} />
        <meta property="og:title" content={getLocalizedText(blog.title, currentLang)} />
        <meta
          property="og:description"
          content={getLocalizedText(blog.description, currentLang).slice(0, 160)}
        />
        {blog.photoUrl && <meta property="og:image" content={blog.photoUrl} />}
        <meta property="og:type" content="article" />
      </Head>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Заголовок */}
        <h1 className="text-3xl font-bold">{getLocalizedText(blog.title, currentLang)}</h1>

        {/* Город, страна, дата */}
        <p className="text-sm text-gray-600">
          {blog.city}, {blog.country} &bull; {new Date(blog.createdAt).toLocaleDateString()}
        </p>

        {/* Фото */}
        {blog.photoUrl && (
          <img
            src={blog.photoUrl}
            alt={getLocalizedText(blog.title, currentLang)}
            className="w-full rounded-lg object-cover max-h-80 mx-auto"
            loading="lazy"
          />
        )}

        {/* Описание */}
        <article className="prose max-w-full">
          <p className="whitespace-pre-line">{getLocalizedText(blog.description, currentLang)}</p>
        </article>

        {/* Услуги в этом городе */}
        <section aria-label={t('services_in_city', 'Услуги в этом городе')}>
          <h2 className="text-2xl font-semibold mb-4">{t('services_in_city', 'Услуги в этом городе')}</h2>

          {loadingServices ? (
            <p>{t('loading_services', 'Загрузка услуг...')}</p>
          ) : services.length === 0 ? (
            <p className="text-gray-500">{t('no_services_found', 'Услуги не найдены')}</p>
          ) : (
            <ul className="space-y-4">
              {services.map((service) => (
                <li
                  key={service._id}
                  className="border p-4 rounded-md shadow-sm cursor-pointer hover:shadow-md transition"
                  onClick={() => router.push(`/booking/${service._id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/booking/${service._id}`);
                    }
                  }}
                  aria-label={`${getLocalizedText(service.title, currentLang)} - ${t('book_now', 'Забронировать')}`}
                >
                  <div className="flex items-center gap-4">
                    {service.photoUrl ? (
                      <img
                        src={service.photoUrl}
                        alt={getLocalizedText(service.title, currentLang)}
                        className="w-20 h-20 object-cover rounded"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                        {t('no_photo', 'Нет фото')}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate">
                        {getLocalizedText(service.title, currentLang)}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {getLocalizedText(service.description, currentLang)}
                      </p>
                      {service.variants && service.variants.length > 0 && (
                        <p className="text-sm mt-1 text-indigo-700">
                          {service.variants
                            .slice(0, 2)
                            .map((v) => `${v.duration} мин - ${v.price} €`)
                            .join(', ')}
                          {service.variants.length > 2 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Script
          id={`ldjson-blog-${id}`} // уникальный ID нужен для Next.js
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </main>
    </>
  );
}


