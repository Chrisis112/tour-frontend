// frontend/types/availability.ts

export interface TimeSlot {
  start: string; // формат: "09:00"
  end: string;   // формат: "13:00"
}

export interface Availability {
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  timeSlots: TimeSlot[];
}
