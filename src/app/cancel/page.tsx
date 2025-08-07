'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function CancelPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-red-50 text-red-900">
      <h1 className="text-4xl font-extrabold mb-4">{t('payment_cancelled', 'Оплата отменена')}</h1>
      <p className="mb-6 text-center max-w-md">
        {t('cancel_message', 'Похоже, вы отменили процесс оплаты. Вы можете попытаться оформить заказ снова.')}
      </p>
      <Link
        href="/"
        className="rounded bg-red-700 text-white px-6 py-3 font-semibold hover:bg-red-800 transition"
      >
        {t('back_to_home', 'Вернуться на главную')}
      </Link>
    </main>
  );
}
