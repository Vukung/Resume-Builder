import { createContext } from "react";
import { User } from "../api/types";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  signup: (data: { email: string; name: string; password: string }) => Promise<void>;
  logout: (redirectPath?: string) => Promise<void>;
  setUser: (user: User | null) => void;
  startDemo: () => Promise<{ user: User; resumeId: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
