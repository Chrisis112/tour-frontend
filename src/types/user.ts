export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    userType: 'CLIENT' | 'THERAPIST';
    photoUrl?: string; 
  }
  