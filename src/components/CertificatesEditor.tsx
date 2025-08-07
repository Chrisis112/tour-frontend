'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface Certificate {
  _id: string;
  fileUrl: string;
  title?: string;
}

export default function CertificatesEditor() {
  const { t } = useTranslation();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [editCert, setEditCert] = useState<Certificate | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('error_unauthorized', 'Неавторизован'));
        setCertificates([]);
        return;
      }
      const { data } = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCertificates(data.certificates ?? []);
    } catch (e: unknown) {
      setCertificates([]);
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? e.response.data.error
          : e instanceof Error
          ? e.message
          : t('error_loading_certificates', 'Ошибка загрузки списка сертификатов');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [API_URL, t]);

  // Вызов fetchCertificates при монтировании и изменении fetchCertificates
  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('certificate', file);
      formData.append('title', title || t('default_certificate_title', 'Сертификат'));
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('error_unauthorized', 'Неавторизован'));

      await axios.post(`${API_URL}/certificates`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setFile(null);
      setTitle('');
      await fetchCertificates();
    } catch (e: unknown) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? e.response.data.error
          : e instanceof Error
          ? e.message
          : t('error_uploading_certificate', 'Ошибка загрузки сертификата');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (cert: Certificate) => {
    setEditCert(cert);
    setEditTitle(cert.title || '');
    setEditFile(null);
    setError(null);
  };

  const handleEditCancel = () => {
    setEditCert(null);
    setEditTitle('');
    setEditFile(null);
    setError(null);
  };

  const handleEditSave = async () => {
    if (!editCert) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (editFile) formData.append('certificate', editFile);
      formData.append('title', editTitle || t('default_certificate_title', 'Сертификат'));
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('error_unauthorized', 'Неавторизован'));

      await axios.put(`${API_URL}/certificates/${editCert._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setEditCert(null);
      setEditTitle('');
      setEditFile(null);
      await fetchCertificates();
    } catch (e: unknown) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? e.response.data.error
          : e instanceof Error
          ? e.message
          : t('error_editing_certificate', 'Ошибка редактирования сертификата');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      setError(t('invalid_certificate_id', 'Некорректный ID сертификата'));
      return;
    }
    if (!window.confirm(t('confirm_delete_certificate', 'Желаете удалить сертификат?'))) return;
    setDeletingId(id);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('error_unauthorized', 'Неавторизован'));

      await axios.delete(`${API_URL}/certificates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (editCert?._id === id) handleEditCancel();
      await fetchCertificates();
    } catch (e: unknown) {
      const msg =
        axios.isAxiosError(e)
          ? e.response?.data?.error || e.response?.statusText || t('error_deleting_certificate', `Ошибка удаления (статус: ${e.response?.status})`)
          : e instanceof Error
          ? e.message
          : t('error_deleting_certificate', 'Ошибка удаления сертификата');
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-8 px-4 max-w-4xl mx-auto">
      <h3 className="font-semibold mb-4 text-lg">{t('certificates_title', 'Сертификаты и дипломы')}</h3>

      {error && (
        <div role="alert" className="bg-red-100 text-red-800 rounded p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6 max-h-64 overflow-y-auto sm:max-h-96 p-2 border rounded shadow-sm bg-white">
        {certificates.map((cert) => (
          <div
            key={cert._id}
            className="relative border rounded p-3 w-28 sm:w-32 flex flex-col items-center"
          >
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={cert.title || t('certificate', 'Сертификат')}
              className="block w-full h-24 sm:h-28 overflow-hidden rounded mb-1"
            >
              <img
                src={cert.fileUrl}
                alt={cert.title || t('certificate', 'Сертификат')}
                className="w-full h-full object-cover"
              />
            </a>
            <span className="text-center text-xs whitespace-normal mb-1">{cert.title || ''}</span>

            <button
              type="button"
              onClick={() => handleEditStart(cert)}
              disabled={loading}
              aria-label={t('edit', 'Редактировать')}
              className="absolute top-2 left-2 text-blue-600 hover:text-blue-800 p-1 rounded"
            >
              ✏️
            </button>

            <button
              type="button"
              onClick={() => handleDelete(cert._id)}
              disabled={deletingId === cert._id}
              aria-label={t('delete', 'Удалить')}
              className="absolute top-2 right-2 text-red-600 hover:text-red-800 p-1 rounded"
            >
              {deletingId === cert._id ? '...' : '✖'}
            </button>
          </div>
        ))}
      </div>

      {!editCert && (
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="border rounded p-2 w-full sm:w-auto"
            disabled={loading}
            aria-label={t('upload_certificate_file', 'Выберите файл сертификата')}
          />
          <input
            type="text"
            placeholder={t('certificate_title_placeholder', 'Название сертификата')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded p-2 flex-grow w-full sm:w-auto"
            disabled={loading}
            aria-label={t('certificate_title', 'Название сертификата')}
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={loading || !file}
            className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 transition w-full sm:w-auto"
          >
            {loading ? t('loading', 'Загрузка...') : t('upload', 'Загрузить')}
          </button>
        </div>
      )}

      {editCert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-certificate-title"
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded p-6 shadow-lg w-full max-w-md max-h-full overflow-auto">
            <h4 id="edit-certificate-title" className="mb-4 font-semibold text-lg text-center">
              {t('edit_certificate', 'Редактировать сертификат')}
            </h4>
            <div className="flex justify-center mb-4">
              <img
                src={editFile ? URL.createObjectURL(editFile) : editCert.fileUrl}
                alt={editTitle}
                className="w-32 h-32 object-cover rounded"
              />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
              disabled={loading}
              aria-label={t('select_new_certificate_file', 'Выберите новый файл')}
              className="border rounded p-2 mb-3 w-full"
            />
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={loading}
              placeholder={t('certificate_title_placeholder', 'Название сертификата')}
              aria-label={t('certificate_title', 'Название сертификата')}
              className="border rounded p-2 w-full mb-6"
            />
            <div className="flex justify-end gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleEditCancel}
                disabled={loading}
                className="bg-gray-300 rounded px-4 py-2 hover:bg-gray-400 flex-grow max-w-[150px]"
              >
                {t('cancel', 'Отмена')}
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={loading}
                className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 flex-grow max-w-[150px]"
              >
                {loading ? t('saving', 'Сохранение...') : t('save', 'Сохранить')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
