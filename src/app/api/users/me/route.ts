import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Получаем заголовок Authorization из входящего запроса
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Токен не найден' }, { status: 401 });
    }

    // Если строка начинается с 'Bearer ', вынимаем токен, иначе используем как есть
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    // URL backend-а с которым происходит проксирование
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!backendUrl) {
      return NextResponse.json({ error: 'Backend URL не задан' }, { status: 500 });
    }

    // Отправляем запрос на backend с токеном
    const response = await fetch(`${backendUrl}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Если backend вернул ошибку, передаем её клиенту
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка авторизации на backend:', response.status, errorText);

      return NextResponse.json(
        { error: 'Ошибка авторизации', details: errorText },
        { status: response.status }
      );
    }

    // Если всё успешно, возвращаем данные пользователя
    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Ошибка сервера API /api/users/me:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
