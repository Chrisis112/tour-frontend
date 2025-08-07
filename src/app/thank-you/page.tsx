'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function ThankYouPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-green-50 text-green-900">
      <h1 className="text-4xl font-extrabold mb-4">{t('thank_you', 'Спасибо за ваш заказ!')}</h1>
      <p className="mb-6 text-center max-w-md">
        {t('thank_you_message', 'Ваша оплата прошла успешно. Скоро с вами свяжется наш специалист для подтверждения бронирования.')}
      </p>
      <Link
        href="/"
        className="rounded bg-green-700 text-white px-6 py-3 font-semibold hover:bg-green-800 transition"
      >
        {t('back_to_home', 'Вернуться на главную')}
      </Link>
    </main>
  );
}
