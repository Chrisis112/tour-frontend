import type { Availability } from './availability'; // если расписание вынесено отдельно

export interface Therapist {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  rating?: number;
}

export interface Service {
  _id: string;
  title: string;
  description: string;
  photoUrl?: string;
  availability: Availability[];
  therapist: Therapist;
  variants: Array<{
  duration: number;   // Например: 30, 60, 90
  price: number;      // Цена для этой длительности
}>
}