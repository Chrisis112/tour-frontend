'use client';

import React, { useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

// Список поддерживаемых языков
const SUPPORTED_LANGS = ['en', 'ru', 'et', 'pl', 'lv', 'lt', 'fi'];

interface City {
  id: string;    // Англоязычное имя для API/базы
  label: string; // Локализованное название для UI
}

interface Country {
  code: string;
  name: string;
  cities: City[];
}

const categoriesList = [
  'sights',
  'nature_parks',
  'lakes_rivers',
  'history_culture',
  'gastronomy',
  'shopping',
  'entertainment',
  'active_sports',
  'transport',
  'accommodation',
  'family',
  'romantic',
  'photo_spots',
  'cultural_events',
  'festivals',
  'nightlife',
  'safety_tips',
  'religious_sites',
  'legends',
  'ecotourism',
];

export default function BlogPage() {
  const { t } = useTranslation();

  // Список стран с локализованными городами и английскими id
  const countriesList: Country[] = [
    {
      code: 'EE',
      name: t('countries.estonia'),
      cities: [
        { id: 'Tallinn', label: t('cities.tallinn') },
        { id: 'Tartu', label: t('cities.tartu') },
        { id: 'Parnu', label: t('cities.parnu') },
      ],
    },
    {
      code: 'LV',
      name: t('countries.latvia'),
      cities: [
        { id: 'Riga', label: t('cities.riga') },
        { id: 'Liepaja', label: t('cities.liepaja') },
        { id: 'Daugavpils', label: t('cities.daugavpils') },
      ],
    },
    {
      code: 'LT',
      name: t('countries.lithuania'),
      cities: [
        { id: 'Vilnius', label: t('cities.vilnius') },
        { id: 'Kaunas', label: t('cities.kaunas') },
        { id: 'Klaipeda', label: t('cities.klaipeda') },
      ],
    },
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

  // Состояния
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [blogTitle, setBlogTitle] = useState<Record<string, string>>(
    Object.fromEntries(SUPPORTED_LANGS.map((lng) => [lng, '']))
  );
  const [blogText, setBlogText] = useState<Record<string, string>>(
    Object.fromEntries(SUPPORTED_LANGS.map((lng) => [lng, '']))
  );

  const [activeLang, setActiveLang] = useState<string>(SUPPORTED_LANGS[0]);

  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Получаем список городов для выбранной страны
  const citiesList = selectedCountryCode
    ? countriesList.find((c) => c.code === selectedCountryCode)?.cities ?? []
    : [];

  // Обработка загрузки фото и генерация превью
  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhoto(file || null);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  }

  // Обработка переключения категорий
  function toggleCategory(categoryKey: string) {
    setSelectedCategories((prev) =>
      prev.includes(categoryKey) ? prev.filter((c) => c !== categoryKey) : [...prev, categoryKey]
    );
  }

  // Изменение заголовка по языку
  function handleTitleChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setBlogTitle((prev) => ({ ...prev, [activeLang]: val }));
  }

  // Изменение описания по языку
  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setBlogText((prev) => ({ ...prev, [activeLang]: val }));
  }

  // Отправка формы
  async function handleSubmit() {
    const hasTitle = Object.values(blogTitle).some((v) => v.trim() !== '');
    const hasText = Object.values(blogText).some((v) => v.trim() !== '');

    if (!selectedCountryCode || !selectedCity || !hasTitle || !hasText || selectedCategories.length === 0) {
      setMessage(t('messages.fill_all_categories'));
      return;
    }

    setMessage(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('country', selectedCountryCode);
      formData.append('city', selectedCity); // Здесь ид города латиницей
      formData.append('title', JSON.stringify(blogTitle));
      formData.append('description', JSON.stringify(blogText));
      formData.append('categories', JSON.stringify(selectedCategories));

      if (photo) formData.append('photo', photo);

      const resp = await fetch(`${API_URL}/blog`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        setMessage(`${t('messages.error')}: ${errorData.error || resp.statusText}`);
      } else {
        setMessage(t('messages.blog_published'));
        // Очистка формы
        setSelectedCountryCode('');
        setSelectedCity('');
        setSelectedCategories([]);
        setBlogTitle(Object.fromEntries(SUPPORTED_LANGS.map((lng) => [lng, ''])));
        setBlogText(Object.fromEntries(SUPPORTED_LANGS.map((lng) => [lng, ''])));
        setPhoto(null);
        setPhotoPreview(null);
        setActiveLang(SUPPORTED_LANGS[0]);
      }
    } catch (error) {
      console.error(error);
      setMessage(t('messages.error_publish'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-6 text-center">{t('blog1.create_blog')}</h2>

      <label htmlFor="country-select" className="block font-medium mb-1">
        {t('labels.country')}
      </label>
      <select
        id="country-select"
        value={selectedCountryCode}
        onChange={(e) => {
          setSelectedCountryCode(e.target.value);
          setSelectedCity('');
        }}
        className="w-full mb-4 border rounded p-2"
      >
        <option value="" disabled>
          -- {t('placeholders.select_country')} --
        </option>
        {countriesList.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>

      <label htmlFor="city-select" className="block font-medium mb-1">
        {t('labels.city')}
      </label>
      <select
        id="city-select"
        value={selectedCity}
        onChange={(e) => setSelectedCity(e.target.value)}
        disabled={!selectedCountryCode}
        className="w-full mb-4 border rounded p-2 disabled:opacity-50"
      >
        <option value="" disabled>
          -- {t('placeholders.select_city')} --
        </option>
        {citiesList.map((city) => (
          <option key={city.id} value={city.id}>
            {city.label}
          </option>
        ))}
      </select>

      <fieldset className="mb-4">
        <legend className="font-medium mb-2">{t('labels.categories')}</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-2">
          {categoriesList.map((catKey) => (
            <label key={catKey} className="inline-flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.includes(catKey)}
                onChange={() => toggleCategory(catKey)}
                className="form-checkbox h-5 w-5 text-indigo-600"
              />
              <span className="text-gray-700">{t(`categories.${catKey}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Языковые вкладки */}
      <div className="mb-4 flex space-x-2">
        {SUPPORTED_LANGS.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveLang(lang)}
            className={`px-3 py-1 rounded border ${
              activeLang === lang ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 text-gray-700 border-gray-300'
            }`}
            aria-label={`${t('labels.lang_switch')} ${lang.toUpperCase()}`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      <label htmlFor="blog-title" className="block font-medium mb-1">
        {t('labels.blog_title')} ({activeLang.toUpperCase()})
      </label>
      <input
        id="blog-title"
        type="text"
        placeholder={t('placeholders.blog_title')}
        value={blogTitle[activeLang]}
        onChange={handleTitleChange}
        className="w-full mb-4 border rounded p-2"
      />

      <label htmlFor="blog-text" className="block font-medium mb-1">
        {t('labels.blog_text')} ({activeLang.toUpperCase()})
      </label>
      <textarea
        id="blog-text"
        rows={6}
        placeholder={t('placeholders.blog_text')}
        value={blogText[activeLang]}
        onChange={handleTextChange}
        className="w-full mb-4 border rounded p-2 resize-y"
      />

      <label htmlFor="blog-photo" className="block font-medium mb-1">
        {t('labels.photo')}
      </label>
      <input
        id="blog-photo"
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="w-full mb-4"
      />
      {photoPreview && (
        <div className="mb-4">
          <img src={photoPreview} alt={t('labels.photo_preview')} className="max-h-40 rounded" />
        </div>
      )}

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.includes(t('messages.blog_published'))
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
          role="alert"
        >
          {message}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-indigo-600 text-white py-3 rounded hover:bg-indigo-700 transition disabled:opacity-50"
        aria-busy={submitting}
      >
        {submitting ? t('buttons.publishing') : t('buttons.publish')}
      </button>
    </section>
  );
}
