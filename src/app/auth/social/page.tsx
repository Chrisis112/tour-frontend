'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SocialAuthHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      // Здесь можно обновить глобальный контекст или состояние авторизации
      router.replace('/profile'); // например, редирект на защищённую страницу
    } else {
      router.replace('/login'); // если токена нет, редирект на логин
    }
  }, [token, router]);

  return <div>Загрузка...</div>;
}
