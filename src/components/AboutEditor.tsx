import React, { useState, useEffect, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface IAbout {
  [lang: string]: string;
}

interface AboutEditorProps {
  about?: IAbout;
  onChange: (about: IAbout) => void;
}

const LANGUAGES = ['ru', 'et', 'fi', 'lt', 'lv', 'pl', 'en'];

export default function AboutEditor({ about = {}, onChange }: AboutEditorProps) {
  const { t } = useTranslation();
  const [localAbout, setLocalAbout] = useState<IAbout>(about);
  const [activeLang, setActiveLang] = useState<string>(LANGUAGES[0]);

  useEffect(() => {
    if (JSON.stringify(about) !== JSON.stringify(localAbout)) {
      setLocalAbout(about);
    }
  }, [about]);

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const updated = { ...localAbout };
    if (value.trim() === '') {
      delete updated[activeLang];
    } else {
      updated[activeLang] = value;
    }
    setLocalAbout(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('about_title', 'О себе')}</h3>
      <div className="mb-2 flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            className={`px-3 py-1 border rounded ${
              activeLang === lang
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
            onClick={() => setActiveLang(lang)}
            aria-pressed={activeLang === lang}
            aria-label={`${t('language_switch', 'Выбрать язык')} ${lang.toUpperCase()}`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
      <textarea
        id={`about-${activeLang}`}
        rows={6}
        className="w-full p-2 border rounded resize-y"
        value={localAbout[activeLang] || ''}
        onChange={handleTextChange}
        placeholder={t('about_title', 'О себе')}
        aria-label={`${t('about_for_language', 'О себе на языке')} ${activeLang.toUpperCase()}`}
      />
    </div>
  );
}
