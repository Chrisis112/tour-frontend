'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Stats {
  completedOrders: number;
  totalEarned: number;
}

interface BookingFilterProps {
  userType: string;
}

export default function BookingFilter({ }: BookingFilterProps) {
  // Хуки вызываем всегда на верхнем уровне
  const params = useParams();
  const [therapists, setTherapists] = useState<User[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState(params?.id || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';



  // Загрузка списка терапевтов
  useEffect(() => {
    async function fetchTherapists() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Пользователь не авторизован');
          return;
        }
        const res = await axios.get<User[]>(`${API_URL}/users`, {
          params: { userType: 'THERAPIST' },
          headers: { Authorization: `Bearer ${token}` },
        });
        setTherapists(res.data);
      } catch {
        setError('Ошибка при загрузке списка терапевтов');
      }
    }
    fetchTherapists();
  }, [API_URL]);

  // Запрос статистики при изменениях выбранного терапевта и дат
  useEffect(() => {
    if (!selectedTherapist || !dateFrom || !dateTo) {
      setStats(null);
      return;
    }

    async function fetchStats() {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Пользователь не авторизован');
          setLoading(false);
          return;
        }
        const res = await axios.get<Stats>(
          `${API_URL}/bookings/manager/stats`,
          {
            params: { therapistId: selectedTherapist, dateFrom, dateTo },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStats(res.data);
      }  catch (e: unknown) {
  let message = 'Ошибка запроса статистики';
  if (e instanceof Error) {
    message = e.message;
  } else if (typeof e === 'object' && e !== null && 'message' in e) {
    // если объект с message
    message = (e as { message?: string }).message ?? message;
  }
  setError(message);
  setStats(null);
} finally {
  setLoading(false);

      }
    }
    fetchStats();
  }, [selectedTherapist, dateFrom, dateTo, API_URL]);

  return (
    <section className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h3 className="text-xl font-semibold mb-4">Статистика и фильтр выполненных заказов</h3>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <label htmlFor="therapist-select" className="block font-medium mb-1">
        Выберите исполнителя
      </label>
      <select
        id="therapist-select"
        className="w-full border rounded p-2 mb-4"
        value={selectedTherapist}
        onChange={(e) => setSelectedTherapist(e.target.value)}
      >
        <option value="">-- Выберите терапевта --</option>
        {therapists.map((t) => (
          <option key={t._id} value={t._id}>
            {t.firstName} {t.lastName}
          </option>
        ))}
      </select>

      <label htmlFor="date-from" className="block font-medium mb-1">
        Дата с
      </label>
      <input
        id="date-from"
        type="date"
        className="w-full border rounded p-2 mb-4"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
      />

      <label htmlFor="date-to" className="block font-medium mb-1">
        Дата по
      </label>
      <input
        id="date-to"
        type="date"
        className="w-full border rounded p-2 mb-4"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
      />

      {loading && <p>Загрузка...</p>}

      {stats && !loading && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p>
            <b>Выполнено заказов:</b> {stats.completedOrders}
          </p>
          <p>
            <b>Заработано:</b> {stats.totalEarned.toFixed(2)} EUR
          </p>
        </div>
      )}
    </section>
  );
}
