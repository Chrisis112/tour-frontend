import React, { useRef, useState } from 'react';
import axios from 'axios';

export default function PhotoUploader({ onUpload }: { onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [fileName, setFileName] = useState(''); // добавляем состояние для имени файла
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name); // сохраняем имя файла
    const formData = new FormData();
    formData.append('photo', file);
    setUploading(true);

    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/upload/service-photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    onUpload(response.data.photoUrl);
    setUploading(false);
  };

  const triggerInput = () => {
    if (!uploading && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
        disabled={uploading}
      />
      <button
        type="button"
        onClick={triggerInput}
        disabled={uploading}
        style={{
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: pressed
            ? '#2563eb'
            : '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '10px 20px',
          fontWeight: 500,
          fontSize: 16,
          transition: 'background 0.15s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          outline: 'none',
          minWidth: '200px', // чтобы кнопка не прыгала при коротких названиях
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
      >
        {uploading
          ? 'Загрузка...'
          : fileName
            ? fileName
            : 'Загрузить фото'}
      </button>
    </div>
  );
}
