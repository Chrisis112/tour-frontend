'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';

interface Variant {
  duration: number;
  price: number;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  dayOfWeek: string;
  timeSlots: TimeSlot[];
}

interface Therapist {
  _id: string;
  firstName: string | { [lang: string]: string };
  lastName: string | { [lang: string]: string };
  photoUrl?: string;
  rating?: number;
}

interface Service {
  _id: string;
  title: string | { [lang: string]: string };
  description: string | { [lang: string]: string };
  photoUrl: string;
  therapistId: string;
  variants: Variant[];
  availability: DayAvailability[];
  therapist: Therapist;
  address?: string;
}

type BusySlot = {
  startMin: number;
  endMin: number;
};

const DAY_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m + mins);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function intervalsOverlap(s1: number, e1: number, s2: number, e2: number) {
  return !(e1 <= s2 || s1 >= e2);
}

function getAllowedWeekDays(service: Service | null) {
  if (!service?.availability) return [];
  return service.availability
    .map((a) => DAY_MAP.indexOf(a.dayOfWeek))
    .filter((i) => i !== -1);
}

function isSlotAtLeastNHoursAhead(slotStart: string, n: number, dateStr: string) {
  const now = new Date();
  const slotDate = new Date(`${dateStr}T${slotStart}`);
  const minAllowed = new Date(now.getTime() + n * 60 * 60 * 1000);
  return slotDate >= minAllowed;
}

function formatDateLocal(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function validateEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function getLocale(field: string | Record<string, string> | undefined, lang: string): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  lang = lang.toLowerCase().split('-')[0];
  if (typeof field[lang] === 'string' && field[lang].trim() !== '') return field[lang];
  if (typeof field['en'] === 'string' && field['en'].trim() !== '') return field['en'];
  for (const key in field) {
    if (typeof field[key] === 'string' && field[key].trim() !== '') return field[key];
  }
  return '';
}

// Type guard для BusySlot
function isBusySlot(obj: unknown): obj is BusySlot {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'startMin' in obj &&
    typeof (obj as Record<string, unknown>).startMin === 'number' &&
    'endMin' in obj &&
    typeof (obj as Record<string, unknown>).endMin === 'number'
  );
}

export default function BookingPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const { serviceId } = useParams() as { serviceId: string };
  const router = useRouter();

  const [price, setPrice] = useState<number>();
  const [service, setService] = useState<Service | null>(null);
  const [duration, setDuration] = useState<number>();
  const [date, setDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string; busy: boolean }[]>([]);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [fullyBookedDates, setFullyBookedDates] = useState<string[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [therapistId, setTherapistId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [success] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en';

  useEffect(() => {
    if (!serviceId) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/services/${serviceId}`)
      .then((res) => {
        setService(res.data);
        if (res.data?.therapistId) {
          setTherapistId(res.data.therapistId);
        } else {
          setTherapistId('');
        }
        if (res.data?.address) {
          setAddress(res.data.address);
        } else {
          setAddress('');
        }
      })
      .catch((err) => {
        console.error(err);
        setError(t('error_loading_service', 'Ошибка загрузки услуги'));
      });
  }, [serviceId, t]);

  useEffect(() => {
    if (isLoggedIn) {
      if (firstName !== user?.firstName) setFirstName(user?.firstName ?? '');
      if (lastName !== user?.lastName) setLastName(user?.lastName ?? '');
      if (email !== user?.email) setEmail(user?.email ?? '');
    } else {
      if (firstName !== '') setFirstName('');
      if (lastName !== '') setLastName('');
      if (email !== '') setEmail('');
    }
  }, [isLoggedIn, user?.firstName, user?.lastName, user?.email]);

  // Fetch busy slots for selected date
  useEffect(() => {
    if (!service || !date) {
      setBusySlots([]);
      return;
    }
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/bookings/slots`, {
        params: { serviceId: service._id, date },
      })
      .then((res) => {
        const busyArrRaw = res.data.busyIntervals ?? res.data.busySlots ?? [];
        const busyArr: BusySlot[] = busyArrRaw
          .map((interval: unknown): BusySlot | null => (isBusySlot(interval) ? interval : null))
          .filter((slot: BusySlot | null): slot is BusySlot => slot !== null);
        setBusySlots(busyArr.sort((a, b) => a.startMin - b.startMin));
      })
      .catch((err) => {
        console.error('Ошибка загрузки busy slots:', err);
        setBusySlots([]);
      });
  }, [service, date]);

  useEffect(() => {
    if (service && service.variants.length > 0) {
      if (!duration) {
        setDuration(service.variants[0].duration);
        setPrice(service.variants[0].price);
      } else {
        const variant = service.variants.find((v) => v.duration === duration);
        if (variant) {
          setPrice(variant.price);
        }
      }
    }
  }, [service, duration]);

  // Fetch busy slots for range of dates and compute fully booked dates
  useEffect(() => {
    if (!service || !duration) return;

    const allowedDays = getAllowedWeekDays(service);
    const datesToCheck: string[] = [];
    const from = new Date();
    for (let i = 0; i < 62; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      if (allowedDays.includes(d.getDay())) datesToCheck.push(formatDateLocal(d));
    }

    // Запрос всех busy слотов для диапазона дат и текущей длительности
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/bookings/slots-range`, {
        params: { serviceId: service._id, dates: datesToCheck.join(','), duration },
      })
      .then((res) => {
        // Ожидается объект { [date]: BusySlot[] }
        const busyByDate: Record<string, BusySlot[]> = res.data;
        const fullDates: string[] = [];

        datesToCheck.forEach((dateStr) => {
          const dayNum = new Date(dateStr).getDay();
          const dayStr = DAY_MAP[dayNum];
          const availability = service.availability.find((d) => d.dayOfWeek === dayStr);

          let hasFree = false;
          if (availability) {
            for (const interval of availability.timeSlots) {
              let slotStart = interval.start;
              while (timeToMinutes(slotStart) + duration <= timeToMinutes(interval.end)) {
                const slotEnd = addMinutes(slotStart, duration);
                const startMin = timeToMinutes(slotStart);
                const endMin = timeToMinutes(slotEnd) + 30;
                const busyArr = busyByDate[dateStr] || [];
                const busy = busyArr.some((bs) => intervalsOverlap(startMin, endMin, bs.startMin, bs.endMin));
                const allowed = !busy && isSlotAtLeastNHoursAhead(slotStart, 3, dateStr);
                if (allowed) {
                  hasFree = true;
                  break;
                }
                slotStart = addMinutes(slotStart, 5);
              }
              if (hasFree) break;
            }
          }
          if (!hasFree) fullDates.push(dateStr);
        });

        setFullyBookedDates(fullDates);

        // Если выбранная дата занята, переключить на ближайшую свободную
        if (date && fullDates.includes(date)) {
          for (const d of datesToCheck) {
            if (!fullDates.includes(d)) {
              setDate(d);
              break;
            }
          }
        }
      })
      .catch((err) => {
        console.error('Ошибка загрузки busy slots для диапазона:', err);
        setFullyBookedDates([]);
      });
  }, [service, duration, date]);

  // Вычисление доступных слотов для выбранной даты
  useEffect(() => {
    if (!service || !date || !duration) {
      setAvailableSlots([]);
      return;
    }
    const dayNum = new Date(date).getDay();
    const dayStr = DAY_MAP[dayNum];
    const dayAvailability = service.availability.find((d) => d.dayOfWeek === dayStr);
    if (!dayAvailability) {
      setAvailableSlots([]);
      return;
    }
    const step = 5;
    const slots: { start: string; end: string; busy: boolean }[] = [];
    for (const interval of dayAvailability.timeSlots) {
      let slotStart = interval.start;
      while (timeToMinutes(slotStart) + duration <= timeToMinutes(interval.end)) {
        const slotEnd = addMinutes(slotStart, duration);
        const startMin = timeToMinutes(slotStart);
        const endMin = timeToMinutes(slotEnd) + 30;
        const busy = busySlots.some((bs) => intervalsOverlap(startMin, endMin, bs.startMin, bs.endMin));
        const allowed = !busy && isSlotAtLeastNHoursAhead(slotStart, 3, date);
        slots.push({
          start: slotStart,
          end: slotEnd,
          busy: !allowed,
        });
        slotStart = addMinutes(slotStart, step);
      }
    }
    setAvailableSlots(slots);
  }, [service, date, duration, busySlots]);

  // Фильтрация доступных дат в DatePicker с учётом fullyBookedDates
  function filterAllowedDate(d: Date) {
    if (!service) return false;
    const allowedDays = getAllowedWeekDays(service);
    const dateStr = formatDateLocal(d);
    return allowedDays.includes(d.getDay()) && !fullyBookedDates.includes(dateStr);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPaymentError(null);
    if (!firstName || !lastName || !phone || !email || !address || !date || !duration || !timeSlot || !therapistId) {
      setError(t('fill_required_fields', 'Пожалуйста, заполните все обязательные поля'));
      return;
    }
    if (!validateEmail(email)) {
      setError(t('invalid_email', 'Некорректный email'));
      return;
    }
    const selSlot = availableSlots.find((s) => s.start === timeSlot);
    if (!selSlot || selSlot.busy) {
      setError(t('slot_unavailable', 'Выбранный интервал времени занят или недоступен'));
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_WS_URL}/api/create-checkout-session`,
        {
          serviceId: service?._id,
          therapistId,
          clientId: user?._id,
          firstName,
          lastName,
          phone,
          email,
          address,
          date,
          duration,
          timeSlot,
          price,
        },
        { headers }
      );
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('Ошибка оплаты: сессия не получена');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? t('booking_error', 'Ошибка при бронировании'));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('booking_error', 'Ошибка при бронировании'));
      }
    } finally {
      setLoading(false);
    }
  }

  if (!service) return <div>{t('loading', 'Загрузка...')}</div>;

  if (success) {
    return (
      <div className="py-20 max-w-md mx-auto text-green-600 font-semibold text-center">
        {t('booking_success', 'Благодарим за бронирование! С вами скоро свяжется терапевт.')}
      </div>
    );
  }

  return (
    <section className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-extrabold mb-4">{getLocale(service.title, currentLang)}</h1>

      {service.photoUrl && (
        <img
          src={service.photoUrl}
          alt={getLocale(service.title, currentLang)}
          className="rounded mb-4 w-full h-52 object-cover"
        />
      )}

      <button
        type="button"
        className="flex items-center gap-2 mb-4 w-full text-left hover:bg-gray-50 rounded transition"
        style={{ cursor: 'pointer' }}
        onClick={() => router.push(`/therapist/${service.therapist._id}`)}
        aria-label={`${getLocale(service.therapist.firstName, currentLang)} ${getLocale(service.therapist.lastName, currentLang)}`}
      >
        <img
          src={service.therapist.photoUrl ?? '/default-avatar.png'}
          alt={`${getLocale(service.therapist.firstName, currentLang)} ${getLocale(service.therapist.lastName, currentLang)}`}
          className="w-10 h-10 rounded-full border object-cover"
        />
        <div>
          <div className="text-indigo-600 font-semibold">
            {getLocale(service.therapist.firstName, currentLang)} {getLocale(service.therapist.lastName, currentLang)}
          </div>
          <div className="text-xs text-gray-500">
            {t('rating_label', 'Рейтинг')}: {service.therapist.rating ?? '—'}
          </div>
        </div>
      </button>

      <p className="mb-4 whitespace-pre-wrap">{getLocale(service.description, currentLang)}</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="flex gap-2">
          <input
            className="w-1/2 border rounded px-2"
            placeholder={t('first_name', 'Имя')}
            value={firstName}
            onChange={isLoggedIn ? undefined : (e) => setFirstName(e.target.value)}
            readOnly={isLoggedIn}
            required
            aria-label={t('first_name', 'Имя')}
          />
          <input
            className="w-1/2 border rounded px-2"
            placeholder={t('last_name', 'Фамилия')}
            value={lastName}
            onChange={isLoggedIn ? undefined : (e) => setLastName(e.target.value)}
            readOnly={isLoggedIn}
            required
            aria-label={t('last_name', 'Фамилия')}
          />
        </div>

        <input
          className="w-full border rounded px-2"
          placeholder={t('email', 'Email')}
          value={email}
          onChange={isLoggedIn ? undefined : (e) => setEmail(e.target.value)}
          readOnly={isLoggedIn}
          required
          aria-label={t('email', 'Email')}
        />

        <PhoneInput
          country="ee"
          value={phone}
          onChange={setPhone}
          inputProps={{
            required: true,
            name: 'phone',
            'aria-label': t('phone', 'Телефон'),
            autoComplete: 'off',
            spellCheck: false,
          }}
          containerClass="mb-4"
        />

        <input
          className="w-full border rounded px-2"
          placeholder={t('address_placeholder', 'Адрес')}
          value={address}
          onChange={(e) => {
            if (!service?.address) setAddress(e.target.value);
          }}
          required
          aria-label={t('address_placeholder', 'Адрес')}
          disabled={!!service?.address}
        />

        <div>
          <label className="block mb-1">{t('duration_label', 'Длительность')}</label>
          <select
            className="w-full border rounded px-2"
            value={duration ?? ''}
            onChange={(e) => {
              setDuration(Number(e.target.value));
              setTimeSlot('');
            }}
            required
          >
            <option value="">{t('select_duration', 'Выберите длительность')}</option>
            {service.variants.map((v) => (
              <option key={v.duration} value={v.duration}>
                {t('duration_price', '{{duration}} min – {{price}} €', { duration: v.duration, price: v.price })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">{t('date_label', 'Дата')}</label>
          <DatePicker
            className="w-full border rounded px-2"
            selected={date ? new Date(date) : null}
            onChange={(d) => {
              if (d instanceof Date && !isNaN(d.getTime())) setDate(formatDateLocal(d));
              else setDate('');
              setTimeSlot('');
            }}
            filterDate={filterAllowedDate}
            minDate={new Date()}
            placeholderText={t('select_date', 'Выберите дату')}
            aria-label={t('select_date', 'Выберите дату')}
            required
          />
        </div>

        <div>
          <label className="block mb-1">{t('time_label', 'Время')}</label>
          <select
            id="time-slot-select"
            className="w-full border rounded px-2"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            disabled={availableSlots.length === 0}
            required
          >
            <option value="">{t('select_time', 'Выберите время')}</option>
            {availableSlots.map((slot, i) => (
              <option
                key={`${slot.start}-${slot.end}-${i}`}
                value={slot.start}
                disabled={slot.busy}
                title={slot.busy ? t('slot_busy', 'Время занято') : undefined}
                aria-disabled={slot.busy}
              >
                {slot.start} — {slot.end} {slot.busy ? `(${t('slot_busy', 'занято')})` : ''}
              </option>
            ))}
          </select>
          {date && availableSlots.length === 0 && (
            <p className="text-xs text-red-600 mt-1" role="alert">
              {t('no_slots', 'Нет доступных интервалов. Попробуйте другую дату.')}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !therapistId || !service}
          aria-busy={loading}
          className="w-full py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          {loading ? t('saving', 'Сохраняем...') : t('book_pay', 'Записаться')}
        </button>

        {error && (
          <p className="mt-2 text-center text-red-600" role="alert">
            {error}
          </p>
        )}

        {paymentError && (
          <p className="mt-2 text-center text-red-600" role="alert">
            {paymentError}
          </p>
        )}
      </form>
    </section>
  );
}
