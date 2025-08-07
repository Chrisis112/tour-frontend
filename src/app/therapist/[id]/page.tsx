'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Head from 'next/head';

interface Certificate {
  fileUrl: string;
  title?: string;
}

interface Variant {
  duration: number;
  price: number;
}

interface Service {
  _id: string;
  title: { [lang: string]: string };
  description: { [lang: string]: string };
  photoUrl: string;
  variants: Variant[];
}

interface Therapist {
  _id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  photoUrl?: string;
  skills?: string[];
  certificates?: Certificate[];
  services?: Service[];
}

interface IAbout {
  [lang: string]: string;
}

interface User {
  _id: string;
  rating?: number;
  about?: IAbout;  // добавлено
}


// Звёзды рейтинга с половинкой
function StarRating({ value }: { value?: number }) {
  const total = 5;
  if (typeof value !== 'number' || value < 0) value = 0;
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const stars = [];
  for (let i = 0; i < total; i++) {
    if (i < full) {
      stars.push(<span key={i} className="text-yellow-400 text-base">★</span>);
    } else if (i === full && hasHalf) {
      stars.push(
        <span key={i} className="text-yellow-400 text-base inline-flex w-5 h-5" role="img" aria-label="half star" >
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="halfstar" x1="0" x2="20" y1="0" y2="0">
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <polygon fill="url(#halfstar)" stroke="#facc15" strokeWidth="1"
              points="10,2 12.59,7.65 18.82,8.34 14,12.97 15.18,18.98 10,15.77
                      4.82,18.98 6,12.97 1.18,8.34 7.41,7.65" />
          </svg>
        </span>
      );
    } else {
      stars.push(<span key={i} className="text-gray-300 text-base">★</span>);
    }
  }
  return <span className="flex gap-0.5 items-center ml-2">{stars}</span>;
}

export default function TherapistProfile() {
  const { t, i18n } = useTranslation();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [user, setUser] = useState<User | null>(null); // Пользователь с рейтингом и about

  // Выбранный язык (локаль)
  const currentLang = typeof window !== 'undefined' ? (localStorage.getItem('i18nextLng') || i18n.language || 'en') : 'en';

  // Функция выбора локализованного текста с fallback на 'en' или первое значение
  const getLocale = (field: Record<string, string> | undefined, lang: string) => {
    if (!field) return '';
    return field[lang] || field['en'] || Object.values(field)[0] || '';
  };

  // Загрузка данных терапевта
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/therapists/${params.id}`)
      .then((res) => setTherapist(res.data))
      .catch(() => setTherapist(null));
  }, [params.id]);

  // Загрузка пользователя с рейтингом и about после загрузки терапевта
  useEffect(() => {
    if (!therapist?._id) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/users/${therapist._id}`)
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, [therapist]);

  if (!therapist) return <div className="py-12 text-center">{t('loading', 'Загрузка...')}</div>;


  const certificates = (therapist.certificates ?? []).filter((c) => !!c.fileUrl);
  const services = therapist.services ?? [];
  const ratingValue = typeof user?.rating === 'number' ? user.rating : 0;

  const pageTitle = `${therapist.firstName} ${therapist.lastName} — MyTherapy`;
  const pageDescription = therapist.bio || `Профиль массажиста ${therapist.firstName} ${therapist.lastName} на MyTherapy`;
  const canonicalUrl = `https://yourdomain.com/therapist/${therapist._id}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={therapist.bio || ''} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="profile" />
        {therapist.photoUrl && <meta property="og:image" content={therapist.photoUrl} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: `${therapist.firstName} ${therapist.lastName}`,
              image: therapist.photoUrl || 'https://yourdomain.com/default-avatar.png',
              description: therapist.bio || '',
              url: canonicalUrl,
            }),
          }}
        />
      </Head>

      <section className="max-w-3xl mx-auto py-8 px-4">
        {/* Верхний блок: фото и базовая инфа */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-8">
          <img
            src={therapist.photoUrl || '/default-avatar.png'}
            className="w-24 h-24 rounded-full border object-cover flex-shrink-0"
            alt={t('therapist_photo_alt', 'Фото массажиста')}
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-2 flex flex-wrap items-center gap-3">
              <span>{therapist.firstName} {therapist.lastName}</span>
              <StarRating value={ratingValue} />
              <span className="ml-3 text-sm text-gray-700">{ratingValue?.toFixed(1)}/5</span>
            </h1>

            {/* bio */}
            {therapist.bio && (
              <p className="text-gray-700 mb-2 whitespace-pre-line">{therapist.bio}</p>
            )}

            {/* Многоязычное поле about из user */}
            {user?.about && Object.keys(user.about).length > 0 && (
              <section className="mb-4">
                <h2 className="text-lg font-semibold mb-1">{t('about_title', 'О себе')}</h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {getLocale(user.about, currentLang)}
                </p>
              </section>
            )}

            {/* Skills */}
            {therapist.skills && therapist.skills.length > 0 && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{t('skills_label', 'Умения')}:&nbsp;</span>
                {therapist.skills.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Сертификаты */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">{t('certificates_title', 'Сертификаты и дипломы')}</h3>
          {certificates.length === 0 ? (
            <p className="text-sm text-gray-500">{t('no_certificates', 'Нет загруженных сертификатов')}</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {certificates.map((cert, i) => (
                <div key={cert.fileUrl + i} className="flex flex-col items-center border rounded p-2 w-40 min-w-[150px]">
                  <img
                    src={cert.fileUrl}
                    alt={cert.title || t('certificate_default_title', 'Сертификат')}
                    className="mb-2 w-full h-20 object-contain rounded bg-gray-100"
                    loading="lazy"
                  />
                  <div className="text-xs text-center mb-1 text-blue-900 font-semibold truncate" title={cert.title || undefined}>
                    {cert.title || t('certificate_default_title', 'Сертификат')}
                  </div>
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-xs"
                  >
                    {t('open_file', 'Открыть файл')}
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Услуги */}
        <section>
          <h3 className="text-lg font-semibold mb-4">{t('services_title', 'Услуги этого массажиста')}</h3>
          {services.length === 0 ? (
            <p className="text-sm text-gray-500">{t('no_services', 'Нет услуг')}</p>
          ) : (
            <div className="flex flex-col gap-6">
              {services.map((service) => (
                <div key={service._id} className="border rounded p-4 flex flex-col sm:flex-row gap-4 items-start">
                  <img
                    src={service.photoUrl}
                    alt={getLocale(service.title, currentLang)}
                    className="w-full sm:w-28 h-28 object-cover rounded flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex flex-col flex-grow min-w-0">
                    <h4 className="font-semibold text-lg truncate" title={getLocale(service.title, currentLang)}>
                      {getLocale(service.title, currentLang)}
                    </h4>
                    <p
                      className="text-gray-600 text-sm mb-2 line-clamp-4"
                      title={getLocale(service.description, currentLang)}
                      style={{ minHeight: '5rem', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}
                    >
                      {getLocale(service.description, currentLang)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-indigo-700 font-semibold mb-3 text-sm">
                      {service.variants.map((v, idx) => (
                        <span key={idx} className="bg-gray-100 rounded px-2 py-0.5">
                          {v.duration} {t('minutes_abbr', 'мин')} — {v.price}€
                        </span>
                      ))}
                    </div>
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold self-start"
                      onClick={() => router.push(`/booking/${service._id}`)}
                      aria-label={`${t('book_now', 'Забронировать')} ${getLocale(service.title, currentLang)}`}
                    >
                      {t('book_now', 'Забронировать')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}
