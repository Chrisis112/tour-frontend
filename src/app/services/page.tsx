'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Flags from 'react-world-flags';
import ServiceFilter from '../../components/ServiceFilter';
import TherapistServicesList from '../../components/TherapistServicesList';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import Head from 'next/head';
import GoldLoadingAnimation from '../../components/GoldLoadingAnimation';

// Типы
interface Variant {
  duration: number;
  price: number;
}

interface DayAvailability {
  dayOfWeek: string;
  timeSlots: { start: string; end: string }[];
}

interface Therapist {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  rating?: number;
}

interface Service {
  _id: string;
  title: Record<string, string>; // объект с переводами
  description: Record<string, string>; // объект с переводами
  photoUrl?: string;
  country?: string;
  city?: string;
  variants: Variant[];
  address?: string; 
  availability: DayAvailability[];
  therapist: Therapist;
}

const countryList = [
  { code: 'EE', name: 'Estonia' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'FI', name: 'Finland' },
  { code: 'DE', name: 'Germany' },
  { code: 'PL', name: 'Poland' },
];
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

function TherapistPhoto({ src, alt }: { src?: string; alt?: string }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = !imgError && src ? src : '/default-avatar.png';

  return (
    <img
      src={imgSrc}
      alt={alt ?? 'therapist'}
      className="w-9 h-9 rounded-full object-cover border"
      onError={() => setImgError(true)}
    />
  );
}

function StarRating({ value }: { value?: number }) {
  if (typeof value !== 'number' || value <= 0) return null;
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;
  const total = 5;
  const stars = [];
  for (let i = 1; i <= total; i++) {
    if (i <= fullStars) {
      stars.push(
        <span key={i} className="text-yellow-400 text-base" aria-label="full-star" role="img">
          ★
        </span>,
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span key={i} className="text-yellow-400 text-base" aria-label="half-star" role="img">
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{ display: 'inline', verticalAlign: 'middle' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="half-grad">
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <polygon
              points="10,2 12.59,7.65 18.82,8.34 14,12.97 15.18,18.98 10,15.77 4.82,18.98 6,12.97 1.18,8.34 7,7.65"
              fill="url(#half-grad)"
              stroke="#facc15"
              strokeWidth="1"
            />
          </svg>
        </span>,
      );
    } else {
      stars.push(
        <span key={i} className="text-gray-300 text-base" aria-label="empty-star" role="img">
          ★
        </span>,
      );
    }
  }
  return <span className="ml-2 flex gap-0.5 items-center">{stars}</span>;
}

export default function ServicesPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window === 'undefined') return i18n.language || 'en';
    return (localStorage.getItem('i18nextLng') || i18n.language || 'en').split('-')[0];
  });

  useEffect(() => {
    const onLanguageChanged = (lng: string) => {
      setCurrentLang(lng.split('-')[0]);
    };
    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, [i18n]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get<Service[]>(`${API_URL}/services/public`, {
        params: { lang: currentLang },
        timeout: 10000,
      });

      if (Array.isArray(response.data)) {
        setServices(response.data);
      } else {
        setServices([]);
        setError(t('error_invalid_data', 'Получены некорректные данные с сервера'));
      }
    } catch {
      setError(t('error_loading', 'Ошибка загрузки'));
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL, currentLang, t]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const countries = useMemo(() => {
    const codes = new Set<string>();
    services.forEach((s) => {
      if (s.country) codes.add(s.country.toUpperCase());
    });
    return countryList.filter((c) => codes.has(c.code));
  }, [services]);

  const cities = useMemo(() => {
    if (!selectedCountry) return [];
    const citySet = new Set<string>();
    services.forEach((s) => {
      if (s.country?.toUpperCase() === selectedCountry.toUpperCase() && s.city) {
        citySet.add(s.city);
      }
    });
    return Array.from(citySet).sort();
  }, [services, selectedCountry]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedCountry && s.country?.toUpperCase() !== selectedCountry.toUpperCase()) return false;
      if (selectedCity && s.city !== selectedCity) return false;
      return true;
    });
  }, [services, selectedCountry, selectedCity]);

  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    setSelectedCity('');
  };
  const handleCityChange = (city: string) => setSelectedCity(city);

  const renderPrices = (variants: Variant[]) => {
    if (!variants || variants.length === 0) {
      return <span className="text-xs text-gray-500">{t('no_information', 'Нет информации')}</span>;
    }
    const toShow = variants.slice(0, 2);
    return (
      <>
        {toShow.map((v, idx) => (
          <span key={idx} className="mr-2 inline-block rounded bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-800">
            {v.duration} {t('minutes', 'мин')} — {v.price} €
          </span>
        ))}
        {variants.length > 2 && <span className="inline-block text-indigo-600 font-semibold">…</span>}
      </>
    );
  };

  // SEO meta теги с учётом фильтров
  const pageTitle = useMemo(() => {
    if (selectedCity && selectedCountry) {
      return t('services_page_title_city_country', {
        city: selectedCity,
        country: countryList.find(c => c.code === selectedCountry)?.name || selectedCountry,
        defaultValue: 'Услуги в {{city}}, {{country}}',
      });
    }
    if (selectedCountry) {
      return t('services_page_title_country', {
        country: countryList.find(c => c.code === selectedCountry)?.name || selectedCountry,
        defaultValue: 'Услуги в {{country}}',
      });
    }
    return t('services_page_title_all', 'Все услуги');
  }, [selectedCity, selectedCountry, t]);

  const pageDescription = useMemo(() => {
    if (selectedCity && selectedCountry) {
      return t('services_page_description_city_country', {
        city: selectedCity,
        country: countryList.find(c => c.code === selectedCountry)?.name || selectedCountry,
        defaultValue: `Находите лучшие услуги и специалистов в ${selectedCity}, ${selectedCountry}. Выбирайте и бронируйте.`,
      });
    }
    if (selectedCountry) {
      return t('services_page_description_country', {
        country: countryList.find(c => c.code === selectedCountry)?.name || selectedCountry,
        defaultValue: `Лучшие услуги и специалисты в регионе ${selectedCountry}.`,
      });
    }
    return t('services_page_description_all', 'Обширный каталог услуг и специалистов у вас под рукой.');
  }, [selectedCity, selectedCountry, t]);

  if (loading) return <div className="text-center"><GoldLoadingAnimation/></div>;
  if (error) return <p className="text-center text-red-600 mb-4">{error}</p>;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {/* Можно добавить canonical, og:image и другие мета-теги при необходимости */}
      </Head>

      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64">
            <ServiceFilter
              countries={countries}
              cities={cities}
              selectedCountry={selectedCountry}
              selectedCity={selectedCity}
              onCountryChange={handleCountryChange}
              onCityChange={handleCityChange}
            />
          </aside>

          <main className="flex-1">
            <h1 className="text-3xl font-bold mb-8 text-center md:text-left">{t('book_rickshaw', 'Забронировать')}</h1>

            {!error && filteredServices.length === 0 && (
              <p className="text-center text-gray-500">{t('no_services', 'Нет доступных услуг')}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
              {filteredServices.map((service) => (
                <article
                  key={service._id}
                  tabIndex={0}
                  role="listitem"
                  onClick={() => router.push(`/booking/${service._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      router.push(`/booking/${service._id}`);
                    }
                  }}
                  aria-label={`${getLocalizedText(service.title, currentLang)}${service.city ? ', ' + service.city : ''}${service.country ? ', ' + service.country : ''}`}
                  className="cursor-pointer rounded-lg bg-white shadow-md overflow-hidden flex flex-col hover:shadow-xl focus:shadow-xl transition"
                >
                  {service.photoUrl && (
                    <img
                      src={service.photoUrl}
                      alt={getLocalizedText(service.title, currentLang)}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  )}

                  <div className="p-4 flex flex-col flex-grow">
                    <div
                      tabIndex={0}
                      role="link"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (service.therapist?._id) router.push(`/therapist/${service.therapist._id}`);
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && service.therapist?._id) {
                          e.preventDefault();
                          router.push(`/therapist/${service.therapist._id}`);
                        }
                      }}
                      aria-label={`${service.therapist.firstName} ${service.therapist.lastName}`}
                      className="flex items-center gap-2 mb-4 cursor-pointer group"
                    >
                      <TherapistPhoto
                        src={service.therapist.photoUrl}
                        alt={`${service.therapist.firstName} ${service.therapist.lastName}`}
                      />
                      <span className="text-indigo-600 font-semibold">
                        {service.therapist.firstName} {service.therapist.lastName}
                      </span>
                      <StarRating value={service.therapist.rating} />
                    </div>

                    {/* Новый контейнер для заголовка с флагом и городом, в одной строке */}
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h2 className="text-lg font-bold whitespace-nowrap break-words flex-shrink">
                        {getLocalizedText(service.title, currentLang)}
                      </h2>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {service.country && (
                          <Flags
                            code={service.country.toUpperCase()}
                            className="w-5 h-5"
                            style={{
                              border: 'none',
                              boxShadow: 'none',
                              borderRadius: 0,
                              background: 'none',
                              display: 'block',
                            }}
                          />
                        )}
                        {service.city && (
                          <span className="text-sm text-gray-600 whitespace-nowrap max-w-xs truncate">
                            {service.city}
                          </span>
                        )}
                      </div>
                    </div>

                    <div aria-label="price list" className="mb-2">
                      {renderPrices(service.variants)}
                    </div>
                    {service.address && (
  <div className="mb-4 text-sm text-gray-700">
    <strong>{t('address_placeholder', 'Забронировать')}</strong>
    <span title={service.address} className="block truncate max-w-full">
      {service.address}
    </span>
  </div>
)}
                    <div aria-label="description" className="mb-4">
                      <p className="whitespace-pre-line max-h-40 overflow-auto">
                        {getLocalizedText(service.description, currentLang)}
                      </p>
                    </div>

                    <div aria-label="work schedule" className="mt-2 mb-2">
                      <h3 className="font-semibold text-sm">{t('working_hours_label', 'Рабочее время')}</h3>
                      {service.availability.length === 0 ? (
                        <p className="text-xs text-gray-500">{t('no_information', 'Нет информации')}</p>
                      ) : (
                        <div className="flex flex-wrap gap-1 text-xs text-gray-700">
                          {service.availability.map((day) => (
                            <span key={day.dayOfWeek} className="rounded bg-gray-100 px-1 py-0.5">
                              <b>{t(`day_names.${day.dayOfWeek}`, day.dayOfWeek)}:</b>{' '}
                              {day.timeSlots.length > 0
                                ? day.timeSlots.map((slot) => `${slot.start}–${slot.end}`).join(', ')
                                : '—'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      className="mt-auto bg-green-600 rounded px-4 py-2 text-white hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/booking/${service._id}`);
                      }}
                      aria-label={`${t('book_now', 'Забронировать')} ${getLocalizedText(service.title, currentLang)}`}
                    >
                      {t('book_now', 'Забронировать')}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {user?.userType?.includes('THERAPIST') && <TherapistServicesList />}
          </main>
        </div>
      </section>
    </>
  );
}
