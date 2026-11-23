import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, setUnauthorizedHandler } from "../api/client";
import { User } from "../api/types";
import { AuthContext } from "./authContextDef";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const userRef = useRef<User | null>(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      const wasDemo = userRef.current?.isDemo === true;
      setUser(null);
      if (wasDemo) {
        toast.error("Your demo has ended. Start a new demo or create an account.");
      } else {
        toast.error("Your session expired. Please log in again.");
      }
      navigate("/login", { replace: true });
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    api
      .me(true)
      .then((data) => {
        if (isMounted) setUser(data.user);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (data: { email: string; password: string }) => {
      const res = await api.login(data);
      setUser(res.user);
      navigate("/", { replace: true });
    },
    [navigate]
  );

  const signup = useCallback(
    async (data: { email: string; name: string; password: string }) => {
      const res = await api.signup(data);
      setUser(res.user);
      navigate("/", { replace: true });
    },
    [navigate]
  );

  const logout = useCallback(
    async (redirectPath?: string) => {
      try {
        await api.logout();
      } finally {
        setUser(null);
        navigate(redirectPath ?? "/login", { replace: true });
      }
    },
    [navigate]
  );

  const startDemo = useCallback(async () => {
    const res = await api.startDemo();
    setUser(res.user);
    navigate(`/resume/${res.resumeId}`);
    return res;
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, setUser, startDemo }}
    >
      {children}
    </AuthContext.Provider>
  );
};
