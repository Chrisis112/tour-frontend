'use client';

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

// Типы для блога
interface Blog {
  _id: string;
  country: string;
  city: string;
  title: Record<string, string>;
  description: Record<string, string>;
  categories?: string[];
  photoUrl?: string;
  createdAt: string;
}

const categoriesList = [
  'sights', 'nature_parks', 'lakes_rivers', 'history_culture',
  'gastronomy', 'shopping', 'entertainment', 'active_sports',
  'transport', 'accommodation', 'family', 'romantic', 'photo_spots',
  'cultural_events', 'festivals', 'nightlife', 'safety_tips',
  'religious_sites', 'legends', 'ecotourism'
];

const SUPPORTED_LANGS = ['en', 'ru', 'et'];

function getLocalizedText(field: Record<string, string> | undefined, lang: string): string {
  if (!field) return '';
  const baseLang = lang.toLowerCase().split('-')[0];
  if (field[baseLang]?.trim()) return field[baseLang];
  if (field['en']?.trim()) return field['en'];
  for (const k in field) {
    if (field[k]?.trim()) return field[k];
  }
  return '';
}

export default function BlogPage() {
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation();

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Blog>>({});
  const [submitting, setSubmitting] = useState(false);

  const [currentLang, setCurrentLang] = useState<string>(() => {
    if (typeof window === 'undefined') return i18n.language || 'en';
    return (localStorage.getItem('i18nextLng') || i18n.language || 'en').split('-')[0];
  });

  // Фильтры
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    const onLangChange = (lng: string) => setCurrentLang(lng.split('-')[0]);
    i18n.on('languageChanged', onLangChange);
    return () => i18n.off('languageChanged', onLangChange);
  }, [i18n]);

  useEffect(() => {
    async function fetchBlogs() {
      setFetching(true);
      setError(null);
      setMessage(null);
      try {
        const res = await fetch(`${API_URL}/blog?lang=${currentLang}`);
        if (!res.ok) throw new Error(t('error_loading_blogs', 'Ошибка загрузки'));
        const data = await res.json();
        if (Array.isArray(data)) {
          setBlogs(data);
          if (data.length === 0) setMessage(t('no_blogs', 'Блоги отсутствуют'));
        } else {
          setError(t('error_invalid_data', 'Получены некорректные данные'));
        }
      } catch {
        setError(t('error_loading_blogs', 'Ошибка загрузки'));
      } finally {
        setFetching(false);
      }
    }
    fetchBlogs();
  }, [API_URL, currentLang, t]);

  const canEdit = user?.email === 'mr.chrisis112@gmail';

  function toggleCategory(category: string) {
    setEditFields(prev => {
      const cats = prev.categories ?? [];
      return {
        ...prev,
        categories: cats.includes(category) ? cats.filter(c => c !== category) : [...cats, category],
      };
    });
  }

  function startEdit(blog: Blog) {
    setEditingId(blog._id);
    setEditFields({
      ...blog,
      title: { ...SUPPORTED_LANGS.reduce((a, l) => ({ ...a, [l]: '' }), {}), ...blog.title },
      description: { ...SUPPORTED_LANGS.reduce((a, l) => ({ ...a, [l]: '' }), {}), ...blog.description },
      categories: blog.categories ?? [],
    });
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditFields({});
    setMessage(null);
  }

  function handleFieldChange(field: 'title' | 'description', lang: string, value: string) {
    setEditFields(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] ?? {}),
        [lang]: value,
      },
    }));
  }

  async function saveEdit() {
    if (
      !editingId ||
      !editFields.title ||
      !editFields.description ||
      !editFields.city?.trim() ||
      !editFields.country?.trim()
    ) {
      setMessage(t('fill_all_fields', 'Пожалуйста, заполните все поля!'));
      return;
    }
    if (
      !Object.values(editFields.title).some(v => v.trim()) ||
      !Object.values(editFields.description).some(v => v.trim())
    ) {
      setMessage(t('fill_all_fields', 'Пожалуйста, заполните все поля!'));
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const resp = await fetch(`${API_URL}/blog/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editFields.title,
          description: editFields.description,
          city: editFields.city,
          country: editFields.country,
          categories: editFields.categories ?? [],
          photoUrl: editFields.photoUrl ?? '',
        }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        setMessage(`${t('update_error', 'Ошибка обновления')}: ${data.error ?? resp.statusText}`);
      } else {
        setMessage(t('blog_updated', 'Блог обновлен'));
        setEditingId(null);
        setEditFields({});
        const reload = await fetch(`${API_URL}/blog?lang=${currentLang}`);
        const newData = await reload.json();
        if (Array.isArray(newData)) setBlogs(newData);
      }
    } catch {
      setMessage(t('update_error', 'Ошибка обновления'));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteBlog(id: string) {
    if (!confirm(t('confirm_delete', 'Удалить?'))) return;

    setMessage(null);

    try {
      const resp = await fetch(`${API_URL}/blog/${id}`, { method: 'DELETE' });
      if (!resp.ok) {
        const data = await resp.json();
        setMessage(`${t('delete_error', 'Ошибка удаления')}: ${data.error ?? resp.statusText}`);
      } else {
        setBlogs(prev => prev.filter(b => b._id !== id));
        setMessage(t('blog_deleted', 'Блог удалён'));
        if (editingId === id) cancelEdit();
      }
    } catch {
      setMessage(t('delete_error', 'Ошибка удаления'));
    }
  }

  // Списки стран и городов для селектов
  const countries = Array.from(new Set(blogs.map(b => b.country))).sort();
  const cities = selectedCountry ? Array.from(new Set(blogs.filter(b => b.country === selectedCountry).map(b => b.city))).sort() : [];

  // Фильтрация блогов
  const filteredBlogs = blogs.filter(blog =>
    (selectedCountry === '' || blog.country === selectedCountry) &&
    (selectedCity === '' || blog.city === selectedCity)
  );

  if (loading || fetching) {
    return <div className="text-center p-8">{t('loading')}</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{t('blogs_title', 'Блоги о путешествиях')}</title>
        <meta name="description" content={t('blogs_description', 'Интересные статьи о странах и городах')} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/blog`} />
      </Head>

      <section className="space-y-8 max-w-6xl mx-auto p-4">
        {message && (
          <div
            role="alert"
            className={`max-w-xl mx-auto mb-6 rounded px-3 py-2 text-center ${
              message.includes('успешно') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Фильтры */}
        <div className="mb-6 flex gap-4 justify-center items-center">
          
          <select
            id="country-select"
            value={selectedCountry}
            onChange={e => {
              setSelectedCountry(e.target.value);
              setSelectedCity('');
            }}
            className="rounded border px-3 py-1"
            aria-label={t('select_country', 'Выберите страну')}
          >
            <option value="">{t('labels.country', 'Все страны')}</option>
            {countries.map(country => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <select
            id="city-select"
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            disabled={!selectedCountry}
            className="rounded border px-3 py-1"
            aria-label={t('select_city', 'Выберите город')}
          >
            <option value="">{t('labels.city', 'Все города')}</option>
            {cities.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filteredBlogs.length === 0 && (
            <p className="text-center col-span-full text-gray-700">{t('no_blogs', 'Блоги отсутствуют')}</p>
          )}

          {filteredBlogs.map(blog => {
            const isEditing = editingId === blog._id;
            const title = getLocalizedText(blog.title, currentLang);
            const description = getLocalizedText(blog.description, currentLang);

            const structuredData = {
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: title,
              description: description,
              datePublished: blog.createdAt,
              author: { '@type': 'Person', name: 'Автор сайта' },
              image: blog.photoUrl || undefined,
            };

            return (
              <Link
                key={blog._id}
                href={`/blog/${blog._id}`}
                tabIndex={0}
                aria-label={`${title} — ${blog.city}, ${blog.country}`}
                className="relative block cursor-pointer rounded border bg-white p-6 shadow hover:shadow-lg focus:shadow-lg"
              >
                <header className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <time>{new Date(blog.createdAt).toLocaleDateString()}</time>
                    <div>{blog.city}, {blog.country}</div>
                  </div>

                  {isEditing ? (
                    <div>
                      {SUPPORTED_LANGS.map(lang => (
                        <input
                          key={lang}
                          type="text"
                          className="mb-2 w-full border-b font-semibold"
                          placeholder={`${t('title')} (${lang.toUpperCase()})`}
                          value={editFields.title?.[lang] ?? ''}
                          onChange={e => handleFieldChange('title', lang, e.target.value)}
                        />
                      ))}
                    </div>
                  ) : (
                    <h3 className="truncate text-lg font-semibold">{title}</h3>
                  )}

                  {!isEditing && blog.categories && blog.categories.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {blog.categories.map(cat => (
                        <span
                          key={cat}
                          className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                        >
                          {t(`categories.${cat}`)}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                {blog.photoUrl && (
                  <img
                    src={blog.photoUrl}
                    alt={title}
                    loading="lazy"
                    className="mb-2 w-full rounded object-cover"
                    style={{ maxHeight: 160 }}
                  />
                )}

                <section className="mb-2">
                  {isEditing ? (
                    <>
                      {SUPPORTED_LANGS.map(lang => (
                        <textarea
                          key={lang}
                          rows={4}
                          className="mb-2 w-full resize-y rounded border p-2"
                          placeholder={`${t('description')} (${lang.toUpperCase()})`}
                          value={editFields.description?.[lang] ?? ''}
                          onChange={e => handleFieldChange('description', lang, e.target.value)}
                        />
                      ))}

                      <fieldset className="max-h-44 overflow-auto rounded border p-2">
                        <legend className="mb-2 font-semibold">{t('categories')}</legend>
                        <div className="grid gap-2 overflow-auto sm:grid-cols-2">
                          {categoriesList.map(cat => (
                            <label key={cat} className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editFields.categories?.includes(cat) ?? false}
                                onChange={() => toggleCategory(cat)}
                              />
                              <span>{t(`categories.${cat}`)}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </>
                  ) : (
                    <p className="whitespace-pre-line text-gray-700">{description}</p>
                  )}
                </section>

                {canEdit && (
                  <footer className="absolute right-4 bottom-4 flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            saveEdit();
                          }}
                          disabled={submitting}
                          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                        >
                          {t('save')}
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            cancelEdit();
                          }}
                          disabled={submitting}
                          className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
                        >
                          {t('cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            startEdit(blog);
                          }}
                          className="rounded bg-yellow-400 px-4 py-2 hover:bg-yellow-500"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            deleteBlog(blog._id);
                          }}
                          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        >
                          {t('delete')}
                        </button>
                      </>
                    )}
                  </footer>
                )}

                <Script
                  id={`ldjson-${blog._id}`} // Added unique id here
                  type="application/ld+json"
                  strategy="afterInteractive"
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
