'use client';

import { useTranslation } from 'react-i18next';
import { useRef } from 'react';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type DayOfWeek = typeof DAYS[number];

const DAY_NAMES: Record<DayOfWeek, string> = {
  Mon: 'Понедельник',
  Tue: 'Вторник',
  Wed: 'Среда',
  Thu: 'Четверг',
  Fri: 'Пятница',
  Sat: 'Суббота',
  Sun: 'Воскресенье',
};

interface TimeSlot {
  start: string;
  end: string;
}

export interface Availability {
  dayOfWeek: DayOfWeek; // строго одна из 'Mon' | 'Tue' | ...
  timeSlots: TimeSlot[];
}

export interface DayAvailability {
  dayOfWeek: string; // более свободный тип (согласован с API/формой)
  timeSlots: TimeSlot[];
}
interface Props {
  availability: Availability[];
  setAvailability: (v: Availability[]) => void;
}

/**
 * Компонент управления расписанием с корректной типизацией
 */
export default function AvailabilityPicker({ availability, setAvailability }: Props) {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const addTimeSlot = (day: DayOfWeek) => {
    // Копируем массив, чтобы React отследил обновление
    const updated = [...availability];
    const dayEntry = updated.find((d) => d.dayOfWeek === day);
    if (dayEntry) {
      dayEntry.timeSlots.push({ start: '', end: '' });
    } else {
      updated.push({ dayOfWeek: day, timeSlots: [{ start: '', end: '' }] });
    }
    setAvailability(updated);
  };

  const handleTimeChange = (
    day: DayOfWeek,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const updated = availability.map((d) =>
      d.dayOfWeek === day
        ? {
            ...d,
            timeSlots: d.timeSlots.map((slot, i) =>
              i === index ? { ...slot, [field]: value } : slot
            ),
          }
        : d
    );
    setAvailability(updated);
  };

  return (
    <div className="border p-4 rounded mb-4" ref={dropdownRef}>
      <h4 className="font-semibold mb-2">{t('availability.schedule', 'График работы по дням')}</h4>
      {DAYS.map((day) => {
        const dayEntry = availability.find((d) => d.dayOfWeek === day);
        return (
          <div key={day} className="mb-3">
            <div className="mb-1 font-medium">{t(`availability.days.${day}`, DAY_NAMES[day])}</div>

            {(dayEntry?.timeSlots ?? []).map((slot, index) => (
              <div key={index} className="flex gap-2 items-center mb-1">
                <input
                  type="time"
                  value={slot.start}
                  onChange={(e) => handleTimeChange(day, index, 'start', e.target.value)}
                  className="border px-2 py-1"
                  aria-label={t('availability.startTime', {
                    day: t(`availability.days.${day}`, DAY_NAMES[day]),
                  })}
                />
                <span aria-hidden="true">—</span>
                <input
                  type="time"
                  value={slot.end}
                  onChange={(e) => handleTimeChange(day, index, 'end', e.target.value)}
                  className="border px-2 py-1"
                  aria-label={t('availability.endTime', {
                    day: t(`availability.days.${day}`, DAY_NAMES[day]),
                  })}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => addTimeSlot(day)}
              className="text-sm text-indigo-600 hover:underline"
              aria-label={t('availability.addSlot', { day: t(`availability.days.${day}`, DAY_NAMES[day]) })}
            >
              {t('availability.addSlotButton', '+ Добавить интервал')}
            </button>
          </div>
        );
      })}
    </div>
  );
}
