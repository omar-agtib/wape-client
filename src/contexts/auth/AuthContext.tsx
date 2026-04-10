import { createContext } from "react";
import type {
  LoginPayload,
  MeResponse,
  RegisterPayload,
  UserRole,
} from "../../types/api";

interface AuthState {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  tenantId: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
