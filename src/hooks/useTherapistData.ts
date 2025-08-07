import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

interface Therapist {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  rating?: number;
  // Добавьте остальные необходимые поля
}

export function useTherapistData(therapistId: string) {
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading1, setLoading1] = useState(true);

  const refetchTherapist = useCallback(async () => {
    setLoading1(true);
    try {
      const res = await axios.get<Therapist>(`${process.env.NEXT_PUBLIC_API_URL}/therapists/${therapistId}`);
      setTherapist(res.data);
    } finally {
      setLoading1(false);
    }
  }, [therapistId]);

  useEffect(() => {
    refetchTherapist();
  }, [refetchTherapist]);

  return { therapist, loading1, refetchTherapist };
}
