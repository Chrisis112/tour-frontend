// Пример React Router
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function SocialAuthHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Извлечь токен из URL
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Сохранить токен (localStorage, cookie и т.п.)
      localStorage.setItem('token', token);

      // Установить авторизацию в приложении (например, обновить контекст или redux)
      // Затем перенаправить пользователя куда-то
      navigate('/profile'); // Или другая защищенная страница
    } else {
      // Если нет токена, редирект на логин
      navigate('/login');
    }
  }, [location, navigate]);

  return <div>Загрузка...</div>;
}

export default SocialAuthHandler;
