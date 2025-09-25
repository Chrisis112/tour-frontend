'use client';

import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import BlogWriter from '../../components/blogWriter';
import BlogList from '../../components/blogList';
import { useTranslation } from 'react-i18next';
import GoldLoadingAnimation from '../../components/GoldLoadingAnimation';

export default function BlogPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading)
    return (
      <div className="text-center py-8 px-4 text-base">
        <GoldLoadingAnimation/>
      </div>
    );

  const canWrite = user?.userType?.includes('MANAGER') ?? false;

  return (
    <>
      <Head>
        <title>{t('tourist_guide', 'Туристический гид')}</title>
        <meta
          name="description"
          content={t(
            'blogs_description',
            'Читайте интересные статьи и истории в наших блогах. Узнайте полезную информацию о путешествиях.'
          )}
        />
        <link
          rel="canonical"
          href={`${
            process.env.NEXT_PUBLIC_SITE_URL || 'mytours.ee'
          }/blog`}
        />
      </Head>

      <main className="max-w-5xl mx-auto w-full px-2 sm:px-4 py-6 md:py-12">
        {/* Скрытый SEO-заголовок */}
        <h1 className="sr-only">{t('blogs', 'Блоги')}</h1>

        {/* WRITE FORM (только для MANAGER) */}
        {canWrite && (
          <section
            className="mb-8 sm:mb-10"
            aria-label={t('create_new_blog', 'Создать новый блог')}
          >
            <BlogWriter />
          </section>
        )}

        {/* LIST блогов */}
        <section
          aria-label={t('blog_list', 'Список блогов')}
          className="w-full"
        >
          <BlogList />
        </section>
      </main>
    </>
  );
}
