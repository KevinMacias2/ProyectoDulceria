export interface User {
  _id?: string;
  id?: number;
  name: string;
  email: string;
  password?: string;
  role?: 'user' | 'admin';
  profileImage?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
