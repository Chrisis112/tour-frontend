'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

type IMessage = {
  _id?: string;
  sender: string;
  text: string;
  timestamp: string;
};

type Order = {
  _id: string;
  clientId: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  therapistId: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  serviceId: {
    _id: string;
    title: string;
  } | null;
  messages: IMessage[];
  date: string;
  timeSlot: string;
  firstName: string;
  lastName: string;
  status: string;
};

type Props = {
  booking: Order;
  onClose: () => void;
  currentUserId: string;
};

export default function ChatDialog({ booking, onClose, currentUserId }: Props) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    // Можно добавить polling/websocket для live обновлений
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const resp = await axios.get(`${baseUrl}/bookings/${booking._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(resp.data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Ошибка загрузки сообщений', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const resp = await axios.post(
        `${baseUrl}/bookings/${booking._id}/messages`,
        { text: message },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(prev => [...prev, resp.data]);
      setMessage('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Ошибка отправки сообщения', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full flex flex-col max-h-[80vh]">
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Чат по заказу: {booking.serviceId?.title} ({new Date(booking.date).toLocaleDateString()} {booking.timeSlot})
          </h2>
          <button
            aria-label="Close chat"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading && <p>Загрузка сообщений...</p>}
          {!loading && messages.length === 0 && <p>Нет сообщений</p>}

          {messages.map(msg => {
            const isMe = msg.sender === currentUserId;
            return (
              <div
                key={msg._id || Math.random()}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-2 ${
                    isMe ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-800'
                  }`}
                >
                  {msg.text}
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-4 border-t border-gray-200 flex gap-2"
        >
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 focus:outline-indigo-500"
            placeholder="Введите сообщение..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            disabled={message.trim().length === 0}
            className="bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-50"
          >
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}
