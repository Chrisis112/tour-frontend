import { useState } from 'react';

export default function BookingForm() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [service, setService] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Логика отправки данных на backend
    alert('Бронирование отправлено!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" required />
      <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input" required />
      <input type="text" value={service} onChange={e => setService(e.target.value)} className="input" placeholder="Тип массажа" required />
      <button type="submit" className="btn btn-primary">Забронировать</button>
    </form>
  );
}
