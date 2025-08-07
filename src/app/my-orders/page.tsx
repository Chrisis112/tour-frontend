'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import UserRatingModal from '../../components/UserRatingModal';
import { io, Socket } from 'socket.io-client';

type UserBrief = { _id: string; firstName: string; lastName: string; phone: string, email: string };
type ServiceBrief = { _id: string; title: string; photo?: string };
type IMessage = { _id?: string; sender: string; text: string; timestamp: string };

type Order = {
  _id: string;
  clientId: UserBrief | null;
  therapistId: UserBrief | null;
  serviceId: ServiceBrief | null;
  date: string;
  timeSlot: string;
  duration: number; // minutes
  status: string;
  email: string;
  phone: string;
  address: string;
  firstName: string;
  lastName: string;
  messages?: IMessage[];
  hasUnreadMessages?: boolean;
  lastReadAt?: Map<string, string> | { [key: string]: string };
};

type IdOrObject = string | { _id: string } | null | undefined;

export default function MyOrders() {
  const { t, i18n } = useTranslation();

  const [userId, setUserId] = useState<string | null>(null);
const [userRole, setUserRole] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'clients'>('orders');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clientsOrders, setClientsOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<IMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingRecipientId, setRatingRecipientId] = useState<string | null>(null);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [ratingRecipientName, setRatingRecipientName] = useState<string>('');

  // Разбор token из localStorage, безопасно (только на клиенте)

useEffect(() => {
  if (typeof window === 'undefined') return;
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    const payload = JSON.parse(atob(token.split('.')[1]));

    setUserId(payload.id || payload.sub || null);

    let roles: string[] | null = null;

    if (payload.role) {
      roles = Array.isArray(payload.role)
        ? payload.role.map((r: string) => r.toLowerCase())
        : [payload.role.toLowerCase()];
    } else if (payload.userType) {
      roles = Array.isArray(payload.userType)
        ? payload.userType.map((r: string) => r.toLowerCase())
        : [payload.userType.toLowerCase()];
    }

    setUserRole(roles);
  } catch {
    // Игнорируем ошибки парсинга
  }
}, []);

  const sameId = (id1: IdOrObject, id2: IdOrObject): boolean => {
    if (!id1 || !id2) return false;
    const a = typeof id1 === 'string' ? id1 : id1._id;
    const b = typeof id2 === 'string' ? id2 : id2._id;
    return a === b;
  };

  function getLastRead(
    lastReadAt: Map<string, string> | { [key: string]: string } | undefined,
    uid: string,
  ): Date | null {
    if (!lastReadAt) return null;
    if (lastReadAt instanceof Map) {
      const val = lastReadAt.get(uid) ?? lastReadAt.get(String(uid));
      return val ? new Date(val) : null;
    }
    if (typeof lastReadAt === 'object') {
      const val = lastReadAt[uid] ?? lastReadAt[String(uid)];
      return val ? new Date(val) : null;
    }
    return null;
  }

  function sortOrdersByStatusAndDate(a: Order, b: Order): number {
    const statusOrder = (status: string) => {
      const s = status.toLowerCase();
      if (s === 'pending') return 0;
      if (s === 'confirmed') return 1;
      return 2;
    };

    const sa = statusOrder(a.status);
    const sb = statusOrder(b.status);
    if (sa !== sb) return sa - sb;

    const aTime = new Date(`${a.date}T${a.timeSlot}`).getTime();
    const bTime = new Date(`${b.date}T${b.timeSlot}`).getTime();

    return aTime - bTime;
  }

  const openRatingModal = (recipientId: string, recipientName: string, orderId: string) => {
    setRatingRecipientId(recipientId);
    setRatingRecipientName(recipientName);
    setRatingOrderId(orderId);
    setRatingModalOpen(true);
  };

  const onRatingSubmitSuccess = () => {
    fetchOrders();
  };

  // Основная функция загрузки заказов с таймаутом и обработкой ошибок
const fetchOrders = useCallback(async () => {
    if (!userId || !userRole) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('error_unauthorized', 'Неавторизован'));
        setLoading(false);
        return;
      }
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await axios.get(`${baseUrl}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 7000,
      });
      const allOrders: Order[] = Array.isArray(response.data) ? response.data : [];

      let filteredOrders: Order[] = [];
      let filteredClientsOrders: Order[] = [];

      if (userRole.includes('therapist') ) {
        // --------------- therapist ---------------
        // В разделе "Мои заказы": Все где я КЛИЕНТ (то есть therapist может быть клиентом!)
        filteredOrders = allOrders
          .filter(o => sameId(o.clientId, userId))
          .map(order => {
            const lastRead = getLastRead(order.lastReadAt, userId);
            const hasUnread = order.messages?.some(
              m => !sameId(m.sender, userId) && (!lastRead || new Date(m.timestamp) > lastRead),
            );
            return { ...order, hasUnreadMessages: hasUnread ?? false };
          });

        // В разделе "Мои клиенты": Все ЗАКАЗЫ, размещённые кем-то у меня
        const clientsResp = await axios.get(`${baseUrl}/bookings/clients`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 7000,
        });
        const clientsData = Array.isArray(clientsResp.data) ? clientsResp.data : [];
        filteredClientsOrders = clientsData
          .filter(o => sameId(o.therapistId, userId) && !sameId(o.clientId, userId))
          .map(order => {
            const lastRead = getLastRead(order.lastReadAt, userId);
            const hasUnread = order.messages?.some(
              (m: { sender: IdOrObject; timestamp: string | number | Date; }) =>
                !sameId(m.sender, userId) && (!lastRead || new Date(m.timestamp) > lastRead),
            );
            return { ...order, hasUnreadMessages: hasUnread ?? false };
          });

        filteredOrders.sort(sortOrdersByStatusAndDate);
        filteredClientsOrders.sort(sortOrdersByStatusAndDate);
      } else {
        // --------------- client ---------------
        // В разделе "Мои заказы": Все где я клиент
        filteredOrders = allOrders
          .filter(o => sameId(o.clientId, userId))
          .map(order => {
            const lastRead = getLastRead(order.lastReadAt, userId);
            const hasUnread = order.messages?.some(
              m => !sameId(m.sender, userId) && (!lastRead || new Date(m.timestamp) > lastRead),
            );
            return { ...order, hasUnreadMessages: hasUnread ?? false };
          });

        filteredOrders.sort(sortOrdersByStatusAndDate);
      }
      setOrders(filteredOrders);
      setClientsOrders(filteredClientsOrders);
    } catch (err: unknown) {
      let message = t('error_loading', 'Ошибка загрузки');
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error || err.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole, t]);


  const loadMessages = useCallback(
    async (bookingId: string) => {
      if (!userId || !userRole) return;

      setLoadingMessages(true);

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error(t('error_unauthorized', 'Неавторизован'));

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const resp = await axios.get(`${baseUrl}/bookings/${bookingId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 7000,
        });
        setChatMessages(resp.data);
        await fetchOrders();
        window.dispatchEvent(new Event('ordersUpdated'));
      } catch {
        setChatMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [userId, userRole, fetchOrders, t],
  );

  const send = useCallback(async () => {
    if (!selectedOrder) return;

    const originalMessage = newMessage.trim();
    if (!originalMessage) return;

    setSending(true);

    try {
      const translateMessage = async (text: string) => {
        // Если нужно, тут реализацию перевода можно сделать
        return text;
      };

      const translated = await translateMessage(originalMessage);

      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('error_unauthorized', 'Неавторизован'));

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      await axios.post(
        `${baseUrl}/bookings/${selectedOrder._id}/messages`,
        { text: translated },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 7000 },
      );

      setNewMessage('');
      await loadMessages(selectedOrder._id);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      // Игнорируем
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedOrder, loadMessages, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
      if (!userId) return;
  
      const socketUrl = process.env.NEXT_PUBLIC_API_WS_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const s = io(socketUrl, {
        transports: ['websocket'],
        autoConnect: false,
        auth: {
          token: localStorage.getItem('token') || '',
        },
      });
      setSocket(s);
      s.connect();
  
      s.on('connect', () => console.log('WebSocket connected:', s.id));
      s.on('disconnect', () => console.log('WebSocket disconnected'));
      s.on('connect_error', (err) => console.error('WebSocket connect_error:', err));
  
      return () => {
        s.disconnect();
      };
    }, [userId]);
  
    // Подписка на комнату с ID заказа и событие "newMessage"
    useEffect(() => {
      if (!socket || !selectedOrder) return;
  
      socket.emit('joinBookingRoom', selectedOrder._id);
  
      const onNewMessage = (message: IMessage & { bookingId: string }) => {
        if (message.bookingId === selectedOrder._id) {
          setChatMessages((prev) => [...prev, message]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
        fetchOrders();
      };
  
      socket.on('newMessage', onNewMessage);
  
      return () => {
        socket.off('newMessage', onNewMessage);
      };
    }, [socket, selectedOrder, fetchOrders]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const openChat = (order: Order) => {
    setSelectedOrder(order);
    loadMessages(order._id);
  };

  function isOrderConfirmed(order: Order) {
    return order.status.toLowerCase() === 'confirmed';
  }

 function renderOrderItem(order: Order, showTherapist: boolean) {
    const confirmed = isOrderConfirmed(order);
    const canSendMessages = !!order.clientId;
    const blurClass = '';
    const hasUnread =
      order.hasUnreadMessages &&
      order.messages &&
      order.messages.length > 0 &&
      !sameId(order.messages[order.messages.length - 1].sender, userId);

    const canRateTherapist = confirmed && showTherapist && order.clientId;
    const canRateClient = confirmed && !showTherapist && order.therapistId;;
    const currentLang = 'en'; // или берите из i18n.language!


     function getLocale(field: string | Record<string, string> | undefined, lang?: string): string {
    lang = lang ?? (i18n.language || 'en').split('-')[0];
    if (!field) return '';
    if (typeof field === 'string') return field;

    if (field[lang]?.trim()) return field[lang];
    if (field['en']?.trim()) return field['en'];
    for (const key in field) {
      if (field[key]?.trim()) return field[key];
    }
    return '';
  }

    return (
      <li
        key={order._id}
        tabIndex={0}
        role="button"
        className={`relative bg-white rounded-lg shadow-lg p-6 mb-6 flex flex-col md:flex-row items-center justify-between cursor-pointer transition-shadow hover:shadow-xl ${blurClass}`}
        onClick={() => {
          if (!confirmed) openChat(order);
        }}
        onKeyDown={(e) => {
          if (!confirmed && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            openChat(order);
          }
        }}
        aria-disabled={confirmed}
      >
       {!confirmed && hasUnread && (
          <span
            className="absolute top-2 right-2 w-3 h-3 bg-red-600 rounded-full animate-pulse"
            aria-label={t('unread_messages', 'Есть новые сообщения')}
          />
        )}

        <div className="flex-1 w-full md:w-auto mb-4 md:mb-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-indigo-600">
              {order.serviceId ? getLocale(order.serviceId.title, currentLang) : t('no_title', 'Без названия')}
            </h3>
            <time className="text-sm text-gray-500" dateTime={order.date}>
              {new Date(order.date).toLocaleDateString()} {order.timeSlot}
            </time>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700 text-sm">
            <div>
              <b>{t('client', 'Клиент')}: </b>
              {order.clientId
                ? `${order.clientId.firstName} ${order.clientId.lastName}`
                : `${order.firstName} ${order.lastName}`}{' '}
              {!order.clientId && <span className="text-gray-400">({t('guest', 'гость')})</span>}
            </div>
            
           {showTherapist && (
              <div>
                <b>{t('therapist', 'Массажист')}: </b>
                {order.therapistId
                  ? `${order.therapistId.firstName} ${order.therapistId.lastName}`
                  : t('not_specified', 'Не указан')}
              </div>
            )}

            {!order.clientId && (
              <div>
                <b>{t('email', 'Email')}:</b> {order.email}
              </div>
            )}

            <div>
              <b>{t('address', 'Адрес')}:</b> {order.address ?? t('not_specified', 'Не указан')}
            </div>
            <div>
              <b>{t('address', 'Адрес')}: </b>
              {order.address ?? t('not_specified', 'Не указан')}
            </div>
          </div>
        </div>

        {confirmed ? (
          <div className="relative z-20 flex flex-col md:flex-row items-center gap-2 justify-center w-full md:w-auto p-4 rounded-lg">
            {canRateTherapist && (
              <button
                className="w-full md:w-32 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={(e) => {
                  e.stopPropagation();
                  openRatingModal(
                    order.clientId!._id,
                    `${order.clientId!.firstName} ${order.clientId!.lastName}`,
                    order._id,
                  );
                }}
              >
                {t('rate_therapist', 'Оценить водителя')}
              </button>
            )}
            {canRateClient && (
              <button
                className="w-full md:w-32 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={(e) => {
                  e.stopPropagation();
                  openRatingModal(
                    order.therapistId!._id,
                    `${order.therapistId!.firstName} ${order.therapistId!.lastName}`,
                    order._id,
                  );
                }}
              >
                {t('rate_client', 'Оценить клиента')}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-2 ml-4 md:ml-0">
            {canSendMessages ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openChat(order);
                }}
                className="btn btn-primary"
              >
                {t('write_message', 'Написать')}
              </button>
            ) : (
              <button
                className="btn btn-primary opacity-50 cursor-not-allowed"
                disabled
                title={t('guest_cannot_message', 'Гости не могут отправлять сообщения')}
              >
                {t('write_message', 'Написать')}
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  if (!userId || !userRole)
    return (
      <div className="flex justify-center items-center h-64 text-gray-600 text-lg">{t('loading', 'Загрузка...')}</div>
    );

  return (
    <>
      <section
        className="max-w-4xl mx-auto p-6 bg-white rounded-md shadow-md relative"
        aria-live="polite"
      >
        {userRole.includes('therapist') && (
          <nav className="mb-8 flex border-b border-gray-300">
            <button
              type="button"
              className={`mr-6 pb-2 font-medium text-lg transition-colors duration-300 ${
                activeTab === 'orders'
                  ? 'border-b-4 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:opacity-60'
              }`}
              onClick={() => setActiveTab('orders')}
              aria-pressed={activeTab === 'orders'}
            >
              {t('my_orders', 'Мои заказы')}
            </button>
            <button
              type="button"
              className={`pb-2 font-medium text-lg transition-colors duration-300 ${
                activeTab === 'clients'
                  ? 'border-b-4 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:opacity-60'
              }`}
              onClick={() => setActiveTab('clients')}
              aria-pressed={activeTab === 'clients'}
            >
              {t('my_clients', 'Мои клиенты')}
            </button>
          </nav>
        )}

        {( activeTab === 'orders') && (
          <>
            <h1 className="text-3xl font-bold mb-6">{t('my_orders', 'Мои заказы')}</h1>
            {loading && <p className="text-center text-gray-700 font-semibold">{t('loading', 'Загрузка...')}</p>}
            {error && <p className="text-center text-red-600 font-semibold">{error}</p>}
            {!loading && orders.length === 0 && <p className="text-center text-gray-500">{t('no_orders', 'Нет заказов')}</p>}
            <ul>{orders.map((order) => renderOrderItem(order, true))}</ul>
          </>
        )}

        { activeTab === 'clients' && (
          <>
            <h1 className="text-3xl font-bold mb-6">{t('my_clients', 'Мои клиенты')}</h1>
            {loading && <p className="text-center text-gray-700 font-semibold">{t('loading', 'Загрузка...')}</p>}
            {error && <p className="text-center text-red-600 font-semibold">{error}</p>}
            {!loading && clientsOrders.length === 0 && <p className="text-center text-gray-500">{t('no_clients', 'Нет клиентов')}</p>}
            <ul>{clientsOrders.map((order) => renderOrderItem(order, false))}
              
            </ul>
            
          </>
        )}
      </section>

      {/* Модалка рейтинга */}
      <UserRatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        onSubmitSuccess={onRatingSubmitSuccess}
        recipientId={ratingRecipientId ?? ''}
        orderId={ratingOrderId ?? ''}
        recipientName={ratingRecipientName}
        userId={userId ?? ''}
        t={t}
      />

      {/* Модалка переписки чата */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-title"
        >
          <div className="bg-white rounded-md shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <header className="p-4 flex justify-between border-b border-gray-300">
              <h2 id="chat-title" className="text-xl font-semibold">
                {`Chat with ${selectedOrder?.clientId?.firstName || selectedOrder?.therapistId?.firstName || 'Unknown'}`}{' '}
  {selectedOrder?.clientId?.lastName || selectedOrder?.therapistId?.lastName || ''}
              </h2>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setChatMessages([]);
                }}
                aria-label={t('close_chat', 'Закрыть')}
                className="text-2xl font-bold text-gray-600 hover:text-gray-900"
              >
                ×
              </button>
            </header>

            <main className="flex-grow overflow-y-auto p-4 bg-gray-50 space-y-3">
              {loadingMessages && <p>{t('loading', 'Загрузка...')}</p>}
              {!loadingMessages && chatMessages.length === 0 && <p>{t('no_messages', 'Нет сообщений')}</p>}
              {chatMessages.map((msg, i) => {
                const isMe = sameId(msg.sender, userId);
                return (
                  <div key={msg._id ?? i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`rounded-lg p-2 max-w-[70%] ${
                        isMe ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {msg.text}
                      <div className="text-xs text-right">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </main>

            <form
              className="p-4 flex gap-2 border-t border-gray-300"
              onSubmit={(e) => {
                e.preventDefault();
                if (newMessage.trim()) send();
              }}
            >
              <input
                type="text"
                autoFocus
                placeholder={t('write_message', 'Написать...')}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded"
                aria-label={t('write_message', 'Написать...')}
              />
              <button
                type="submit"
                disabled={sending || newMessage.trim() === ''}
                className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
              >
                {sending ? t('sending', 'Отправка...') : t('send', 'Отправить')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
