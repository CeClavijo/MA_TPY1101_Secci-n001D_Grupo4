export interface User {
  uid: string;
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'profesor' | 'alumno';
  createdAt: number;
}
