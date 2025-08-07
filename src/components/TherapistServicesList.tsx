'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import PhotoUploader from '../components/photoUploader';
import AvailabilityPicker, { Availability } from '../components/AvailabilityPicker';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Variant {
  duration: number;
  price: number;
}

interface Service {
  _id: string;
  title: { [lang: string]: string };
  description: { [lang: string]: string };
  photoUrl: string;
  availability?: Availability[];
  therapistId?: string;
  variants: Variant[];
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120];
const SUPPORTED_LANGS = ['en', 'ru', 'et','pl', 'lv', 'lt', 'fi'];

// Функция безопасного выбора локализованного текста с fallback
function getLocale(field: Record<string, string> | undefined, lang: string): string {
  if (!field) return '';
  lang = lang.toLowerCase().split('-')[0]; // убираем региональную часть
  if (typeof field[lang] === 'string' && field[lang].trim() !== '') return field[lang];
  if (typeof field['en'] === 'string' && field['en'].trim() !== '') return field['en'];
  for (const key in field) {
    if (typeof field[key] === 'string' && field[key].trim() !== '') return field[key];
  }
  return '';
}

export default function TherapistServicesList() {
  const { t, i18n } = useTranslation();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Service>>({
    title: {},
    description: {},
    photoUrl: '',
    availability: [],
    variants: [{ duration: 60, price: 0 }],
  });

  // react-совместимый язык интерфейса (без региона), обновляется при смене языка i18next
  const [currentLang, setCurrentLang] = useState(() => {
    const lang = typeof window !== 'undefined'
      ? localStorage.getItem('i18nextLng') || i18n.language || 'en'
      : i18n.language || 'en';
    return lang.split('-')[0];
  });

  // Язык, который редактируем в форме
  const [editLang, setEditLang] = useState(currentLang);

  // Подписка на изменение языка i18next
  useEffect(() => {
    const onLanguageChanged = (lng: string) => {
      const shortLng = lng.split('-')[0];
      setCurrentLang(shortLng);
      // при переключении языка, не в режиме редактирования — меняем язык для формы
      if (!editId) setEditLang(shortLng);
    };
    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, [i18n, editId]);

  // Загрузка услуг
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('error_unauthorized', 'Пользователь не авторизован'));
      const response = await axios.get<Service[]>(`${process.env.NEXT_PUBLIC_API_URL}/services`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      if (Array.isArray(response.data)) {
        setServices(response.data);
      } else {
        setServices([]);
        setError(t('error_invalid_data', 'Получены некорректные данные с сервера'));
      }
    } catch (err: unknown) {
      let msg = t('error_loading_services', 'Ошибка при загрузке услуг');
      if (axios.isAxiosError(err)) msg = err.response?.data?.error ?? msg;
      else if (err instanceof Error) msg = err.message;
      setError(msg);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Начинаем редактирование: устанавливаем сервис, наполняем форму и задаём язык редактирования
  const handleEdit = (service: Service) => {
    setEditId(service._id);
    setForm({
      title: service.title || { en: '' },
      description: service.description || { en: '' },
      photoUrl: service.photoUrl || '',
      availability: service.availability ?? [],
      variants: service.variants.length ? service.variants.map(v => ({ ...v })) : [{ duration: 60, price: 0 }],
    });
    setEditLang(currentLang);
  };

  // Обновляем услугу на сервере с валидацией по текущему языку редактирования
  const handleUpdate = async () => {
    if (!editId) return;
    setError(null);

    if (!form.title?.[editLang] || form.title[editLang].trim() === '') {
      setError(t('form_error_title_required', 'Введите название'));
      return;
    }
    if (!form.description?.[editLang] || form.description[editLang].trim() === '') {
      setError(t('form_error_description_required', 'Введите описание'));
      return;
    }
    if (!form.variants || form.variants.length === 0) {
      setError(t('form_error_variants_required', 'Заполните варианты (длительность и цена)'));
      return;
    }
    if (form.variants.some(v => !v.duration || v.price === undefined || v.price === null)) {
      setError(t('form_error_variants_required', 'Заполните варианты (длительность и цена)'));
      return;
    }
    if (!form.availability || form.availability.length === 0) {
      setError(t('form_error_availability_required', 'Добавьте расписание'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('error_unauthorized', 'Пользователь не авторизован'));
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/services/${editId}`, {
        ...form,
        variants: form.variants.filter(v => v.duration && v.price !== undefined && v.price !== null),
        availability: form.availability,
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setEditId(null);
      await fetchServices();
    } catch (err: unknown) {
      let msg = t('error_editing_service', 'Ошибка при редактировании услуги');
      if (axios.isAxiosError(err)) msg = err.response?.data?.error ?? msg;
      else if (err instanceof Error) msg = err.message;
      setError(msg);
    }
  };

  // Удаление услуги
  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirm_delete_service', 'Удалить эту услугу?'))) return;
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('error_unauthorized', 'Пользователь не авторизован'));
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      await fetchServices();
    } catch (err: unknown) {
      let msg = t('error_deleting_service', 'Ошибка при удалении услуги');
      if (axios.isAxiosError(err)) msg = err.response?.data?.error ?? msg;
      else if (err instanceof Error) msg = err.message;
      setError(msg);
    }
  };

  // Обновление варианта
  const updateVariant = (idx: number, field: keyof Variant, value: number | string) => {
    setForm(f => ({
      ...f,
      variants: f.variants ? f.variants.map((v, i) =>
        i === idx ? { ...v, [field]: typeof value === 'string' ? Number(value) : value } : v
      ) : [{ duration: 60, price: 0 }],
    }));
  };

  // Добавить вариант
  const addVariant = () => {
    setForm(f => ({
      ...f,
      variants: [...(f.variants ?? [{ duration: 60, price: 0 }]), { duration: 60, price: 0 }],
    }));
  };

  // Удалить вариант
  const removeVariant = (idx: number) => {
    setForm(f => ({
      ...f,
      variants: f.variants ? f.variants.filter((_, i) => i !== idx) : [],
    }));
  };

  if (loading) return <div>{t('loading', 'Загрузка...')}</div>;
  if (error) return <div className="text-red-600 mb-4">{error}</div>;

  return (
    <section className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6">{t('my_services', 'Мои услуги')}</h2>
      {services.length === 0 && <div className="text-gray-500">{t('no_services_added', 'Нет добавленных услуг')}</div>}

      <ul className="space-y-6">
        {services.map(service => (
          editId === service._id ? (
            <li key={service._id} className="border p-4 rounded bg-gray-50">
              {/* Переключатель языков для формы */}
              <div className="flex gap-2 mb-2 flex-wrap">
                {SUPPORTED_LANGS.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setEditLang(lang)}
                    className={`rounded px-3 py-1 text-xs font-semibold border ${
                      editLang === lang
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-indigo-100 hover:text-indigo-700'
                    }`}
                    aria-label={`Выбрать язык ${lang}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {/* Поля ввода для выбранного языка */}
              <input
                className="border mb-2 w-full px-2 py-1"
                value={form.title?.[editLang] ?? ''}
                onChange={e => setForm(f => ({ ...f, title: { ...(f.title ?? {}), [editLang]: e.target.value } }))}
                placeholder={t('placeholder_title_lang', { lang: editLang, defaultValue: `Название (${editLang})` })}
                aria-label={t('placeholder_title_lang', { lang: editLang, defaultValue: `Название (${editLang})` })}
              />
              <textarea
                className="border mb-4 w-full px-2 py-1"
                value={form.description?.[editLang] ?? ''}
                onChange={e => setForm(f => ({ ...f, description: { ...(f.description ?? {}), [editLang]: e.target.value } }))}
                placeholder={t('placeholder_description_lang', { lang: editLang, defaultValue: `Описание (${editLang})` })}
                aria-label={t('placeholder_description_lang', { lang: editLang, defaultValue: `Описание (${editLang})` })}
              />

              {/* Варианты */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">{t('variants_label', 'Варианты (длительность и цена):')}</label>
                {form.variants?.map((variant, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={variant.duration}
                      onChange={e => updateVariant(idx, 'duration', e.target.value)}
                      aria-label={t('select_duration', 'Выберите длительность')}
                    >
                      {DURATION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>
                          {opt} {t('minutes', 'мин')}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      className="border rounded px-2 py-1 w-20"
                      value={variant.price}
                      onChange={e => updateVariant(idx, 'price', e.target.value)}
                      placeholder={t('price_placeholder', 'Цена (€)')}
                      aria-label={t('price_placeholder', 'Цена (€)')}
                    />
                    {(form.variants?.length ?? 0) > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="text-red-600 px-2 py-1 hover:bg-gray-100 rounded"
                        title={t('remove_variant', 'Удалить вариант')}
                        aria-label={t('remove_variant', 'Удалить вариант')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-indigo-600 underline text-sm"
                  aria-label={t('add_variant', 'Добавить вариант')}
                >
                  + {t('add_variant', 'Добавить вариант')}
                </button>
              </div>

              {/* Фото и расписание */}
              <div className="mb-3">
                <PhotoUploader onUpload={url => setForm(f => ({ ...f, photoUrl: url }))} />
                {form.photoUrl && (
                  <img src={form.photoUrl} alt={t('service_photo_alt', 'Фото услуги')} className="w-24 h-24 object-cover rounded border mt-2" />
                )}
                <AvailabilityPicker
                  availability={form.availability ?? []}
                  setAvailability={availability => setForm(f => ({ ...f, availability }))}
                />
              </div>

              <div className="flex gap-2">
                <button onClick={handleUpdate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded" aria-label={t('save', 'Сохранить')}>
                  {t('save', 'Сохранить')}
                </button>
                <button onClick={() => setEditId(null)} className="bg-gray-300 px-4 py-2 rounded" aria-label={t('cancel', 'Отмена')}>
                  {t('cancel', 'Отмена')}
                </button>
              </div>
            </li>
          ) : (
            <li key={service._id} className="border p-4 rounded flex items-center gap-4">
              <img src={service.photoUrl ?? '/default-service.png'} alt={getLocale(service.title, currentLang)} className="w-16 h-16 object-cover rounded border mr-4 flex-shrink-0" />
              <div className="flex flex-col flex-grow min-w-0">
                <h3 className="font-bold truncate" title={getLocale(service.title, currentLang)}>
                  {getLocale(service.title, currentLang)}
                </h3>
                <p className="text-gray-600 text-sm truncate" title={getLocale(service.description, currentLang)}>
                  {getLocale(service.description, currentLang)}
                </p>
              </div>
              <div className="flex flex-col ml-4 space-y-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(service)}
                  className="bg-indigo-600 hover:bg-yellow-500 text-white px-3 py-1 rounded"
                  aria-label={t('edit', 'Редактировать')}
                >
                  {t('edit', 'Редактировать')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(service._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  aria-label={t('delete', 'Удалить')}
                >
                  {t('delete', 'Удалить')}
                </button>
              </div>
            </li>
          )
        ))}
      </ul>

      <div className="mt-6">
        <Link href="/services/add" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-700 transition">
          + {t('add_service', 'Добавить')}
        </Link>
      </div>
    </section>
  );
}
