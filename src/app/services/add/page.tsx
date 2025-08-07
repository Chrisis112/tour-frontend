'use client';

import axios from 'axios';
import { useState } from 'react';
import AvailabilityPicker from '../../../components/AvailabilityPicker';
import type { Availability } from '../../../types/availability';
import ServicePhotoUploader from '../../../components/photoUploader';
import FlagsSelect from 'react-flags-select';
import { useTranslation } from 'react-i18next';

const DURATION_OPTIONS = [
  { value: 10, label: '10 минут' },
  { value: 30, label: '30 минут' },
  { value: 45, label: '45 минут' },
  { value: 60, label: '60 минут' },
  { value: 90, label: '90 минут' },
  { value: 120, label: '120 минут' },
];

const countryList = [
  { code: 'EE', name: 'Estonia' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'FI', name: 'Finland' },
  { code: 'DE', name: 'Germany' },
  { code: 'PL', name: 'Poland' },
  // Добавьте необходимые страны
];

const citiesByCountry: Record<string, string[]> = {
  EE: ['Tallinn', 'Tartu', 'Narva', 'Pärnu'],
  LV: ['Riga', 'Daugavpils', 'Liepaja'],
  LT: ['Vilnius', 'Kaunas', 'Klaipeda'],
  FI: ['Helsinki', 'Espoo', 'Tampere'],
  DE: ['Berlin', 'Munich', 'Hamburg'],
  PL: ['Warsaw', 'Krakow', 'Wroclaw'],
};

const SUPPORTED_LANGS = ['et', 'ru', 'en', 'pl', 'lt', 'lv', 'fi'];

type Variant = {
  duration: number | '';
  price: string;
};

export default function AddServicePage() {
  const { t, i18n } = useTranslation();

  // Выбранный язык для редактирования (title и description)
  const [editLang, setEditLang] = useState<string>(
    typeof window !== 'undefined'
      ? localStorage.getItem('i18nextLng') || i18n.language || 'en'
      : i18n.language || 'en'
  );

  const [form, setForm] = useState<{
    title: { [lang: string]: string };
    description: { [lang: string]: string };
    photoUrl: string;
    availability: Availability[];
    variants: Variant[];
    address?: string;
  }>({
    title: {},
    description: {},
    photoUrl: '',
    availability: [],
    variants: [{ duration: 60, price: '' }],
    address: '', 
  });

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('');
  const [countryName, setCountryName] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { duration: '', price: '' }],
    }));

  const removeVariant = (idx: number) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== idx),
    }));

  const updateVariant = (
    idx: number,
    field: 'duration' | 'price',
    value: number | '' | string
  ) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) =>
        i === idx
          ? {
              ...v,
              [field]: field === 'duration' ? (typeof value === 'number' ? value : '') : value,
            }
          : v
      ),
    }));
  };

  const setPhotoUrl = (url: string) => {
    setForm((prev) => ({ ...prev, photoUrl: url }));
  };

  const handleCountryChange = (code: string) => {
    setCountry(code);
    const found = countryList.find((c) => c.code === code);
    setCountryName(found ? found.name : '');
    setCity(''); // сброс города при смене страны
  };

  const handleCityChange = (value: string) => {
    setCity(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Валидация на выбранном языке (editLang)
    if (!(form.title[editLang]?.trim())) {
      setError(t('form_error_title_required', 'Введите название'));
      return;
    }
    if (!(form.description[editLang]?.trim())) {
      setError(t('form_error_description_required', 'Введите описание'));
      return;
    }
    if (!country) {
      setError(t('form_error_country_required', 'Выберите страну'));
      return;
    }
    if (!city.trim()) {
      setError(t('form_error_city_required', 'Выберите город'));
      return;
    }
    if (
      form.variants.length === 0 ||
      form.variants.some((v) => !v.duration || !v.price.trim())
    ) {
      setError(t('form_error_variants_required', 'Заполните варианты (длительность и цена)'));
      return;
    }
    if (form.availability.length === 0) {
      setError(t('form_error_availability_required', 'Добавьте расписание'));
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert(t('form_error_unauthorized', 'Вы не авторизованы'));
        setLoading(false);
        return;
      }

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/services`,
        {
          title: form.title,
          description: form.description,
          photoUrl: form.photoUrl,
          availability: form.availability,
          address: form.address,
          country,
          countryName,
          city,
          variants: form.variants.map((v) => ({
            duration: Number(v.duration),
            price: Number(v.price),
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200 || res.status === 201) {
        setSuccess(true);
        // Сброс формы и полей
        setForm({
          title: {},
          description: {},
          photoUrl: '',
          availability: [],
          variants: [{ duration: 60, price: '' }],
        });
        setCountry('');
        setCountryName('');
        setCity('');
      } else {
        setError(t('form_error_submit_failed', 'Ошибка при добавлении'));
      }
    } catch (err: unknown) {
      let message = t('form_error_submit_failed', 'Ошибка при добавлении');
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error ?? message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const availableCities = country ? citiesByCountry[country] || [] : [];

  return (
    <section className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-4">{t('form_title', 'Добавить новую услугу')}</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Языковой переключатель */}
        <div className="flex gap-2 mb-2 flex-wrap">
          {SUPPORTED_LANGS.map((lang) => (
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

        {/* title и description для выбранного языка */}
        <input
          type="text"
          name={`title-${editLang}`}
          placeholder={t('form_placeholder_title', 'Название услуги')}
          className="w-full border px-3 py-2 rounded"
          value={form.title[editLang] || ''}
          onChange={(e) =>
            setForm((f) => ({ ...f, title: { ...f.title, [editLang]: e.target.value } }))
          }
          required
        />

        <textarea
          name={`description-${editLang}`}
          placeholder={t('form_placeholder_description', 'Описание')}
          className="w-full border px-3 py-2 rounded"
          value={form.description[editLang] || ''}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: { ...f.description, [editLang]: e.target.value } }))
          }
          required
        />

        <label className="block mb-1 font-semibold">{t('form_label_upload_photo', 'Выберите фото услуги:')}</label>
        <ServicePhotoUploader onUpload={setPhotoUrl} />

        {form.photoUrl && (
          <img
            src={form.photoUrl}
            alt={t('service_photo_alt', 'Фото услуги')}
            className="w-24 h-24 object-cover rounded border mt-2"
          />
        )}

        <label className="block mb-1 font-medium">{t('form_label_country', 'Страна *')}</label>
        <FlagsSelect
          selected={country}
          countries={countryList.map((c) => c.code)}
          customLabels={Object.fromEntries(countryList.map((c) => [c.code, c.name]))}
          onSelect={handleCountryChange}
          placeholder={t('form_placeholder_country', 'Выберите страну')}
          searchable
          className="w-full"
        />

        <label className="block mb-1 font-medium">{t('form_label_city', 'Город *')}</label>
        <select
          className="w-full border rounded px-2 py-1"
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          disabled={!country}
          required
        >
          <option value="">{t('form_placeholder_city', 'Выберите город')}</option>
          {availableCities.map((cityName) => (
            <option key={cityName} value={cityName}>
              {cityName}
            </option>
          ))}
        </select>
        <label className="block mb-1 font-medium">
  {t('form_label_address', 'Адрес услуги (необязательно)')}
</label>
<input
  type="text"
  className="w-full border px-3 py-2 rounded text-gray-500 placeholder-gray-400"
  placeholder={t(
    'form_placeholder_address',
    'Если пропустите адрес выберет клиент'
  )}
  value={form.address || ''}
  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
/>
        <label className="block mb-1 font-semibold">{t('form_label_variants', 'Варианты по длительности и цене *')}</label>
        {form.variants.map((variant, idx) => (
          <div className="flex gap-2 items-center mb-2" key={idx}>
            <select
              className="border rounded px-2 py-1"
              value={variant.duration}
              onChange={(e) => updateVariant(idx, 'duration', Number(e.target.value))}
              required
            >
              <option value="">{t('form_placeholder_duration', 'Длительность')}</option>
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="border rounded px-2 py-1 w-28"
              value={variant.price}
              placeholder={t('form_placeholder_price', 'Цена (€)')}
              onChange={(e) => updateVariant(idx, 'price', e.target.value)}
              required
            />

            {form.variants.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariant(idx)}
                className="text-red-600 hover:bg-gray-100 rounded px-2 py-1"
                title={t('form_button_remove_variant', 'Удалить вариант')}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button type="button" className="text-indigo-600 underline text-sm mt-1" onClick={addVariant}>
          {t('form_button_add_variant', 'Добавить ещё')}
        </button>

        <AvailabilityPicker
          availability={form.availability}
          setAvailability={(newAvailability) => setForm({ ...form, availability: newAvailability })}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700"
        >
          {loading ? t('form_button_loading', 'Добавление...') : t('form_button_submit', 'Сохранить')}
        </button>

        {success && <div className="text-green-600 mt-2">{t('form_success', 'Успешно добавлено!')}</div>}
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </form>
    </section>
  );
}
