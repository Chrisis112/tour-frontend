'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Country {
  code: string;
  name: string;
}

interface BlogFilterProps {
  countries: Country[];
  cities: string[];
  selectedCountry?: string;
  selectedCity?: string;
  onCountryChange: (countryCode: string) => void;
  onCityChange: (city: string) => void;
}

export default function BlogFilter({
  countries,
  cities,
  selectedCountry = '',
  selectedCity = '',
  onCountryChange,
  onCityChange,
}: BlogFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-4 border border-gray-300 rounded p-4 bg-white shadow-sm w-64">
      <h3 className="text-lg font-semibold mb-4">{t('filter.select_filter', 'Выберите фильтр:')}</h3>

      <label htmlFor="country" className="block font-medium mb-1">
        {t('filter.country', 'Страна')}
      </label>
      <select
        id="country"
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-indigo-500"
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
      >
        <option value="">{t('filter.all_countries', 'Все страны')}</option>
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>

      <label htmlFor="city" className="block font-medium mb-1">
        {t('filter.city', 'Город')}
      </label>
      <select
  value={selectedCity}
  onChange={e => onCityChange(e.target.value)}
  disabled={!selectedCountry}
>
  <option value="">Все города</option>
  {cities.map(city => (
    <option key={city} value={city}>{city}</option>
  ))}
</select>
    </div>
  );
}
