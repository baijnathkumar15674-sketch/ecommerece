
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          disableAutoSelect?: () => void;
        };
      };
    };
  }
}

// SHOPORA production backend
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://ecommerece-sr29.onrender.com"
).replace(/\/+$/, "");

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt?: string;
};

type AuthContextValue = {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  linkGoogleAccount: (credential: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (data: {
    name: string;
    email: string;
    phone: string;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "shopora_customer_token";

async function request<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Accept: "application/json",
      ...(body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined
      ? {}
      : { body: JSON.stringify(body) }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : `Request failed (${response.status})`,
    );
  }

  return data as T;
}

type AuthResponse = {
  user: Customer;
  accessToken: string;
};

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setCustomer(null);

    window.google?.accounts?.id?.disableAutoSelect?.();

    try {
      if (token) {
        await request("/auth/customer/logout", {}, token);
      }
    } catch (error) {
      console.error("Server logout failed:", error);
    } finally {
      window.location.replace("/login");
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const token = sessionStorage.getItem(TOKEN_KEY);

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const profile = await request<Customer>(
          "/auth/customer/me",
          undefined,
          token,
        );

        if (active) setCustomer(profile);
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);
        if (active) setCustomer(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await request<AuthResponse>(
        "/auth/customer/login",
        { email, password },
      );

      sessionStorage.setItem(TOKEN_KEY, result.accessToken);
      setCustomer(result.user);
    },
    [],
  );

  const googleLogin = useCallback(
    async (credential: string) => {
      const result = await request<AuthResponse>(
        "/auth/google",
        { credential },
      );

      sessionStorage.setItem(TOKEN_KEY, result.accessToken);
      setCustomer(result.user);
    },
    [],
  );

  const linkGoogleAccount = useCallback(
    async (credential: string) => {
      const token = sessionStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error(
          "Please sign in to your Shopora account first.",
        );
      }

      await request<{ message: string }>(
        "/auth/customer/link-google",
        { credential },
        token,
      );
    },
    [],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      phone?: string,
    ) => {
      const result = await request<AuthResponse>(
        "/auth/customer/register",
        {
          name,
          email,
          password,
          ...(phone?.trim() ? { phone: phone.trim() } : {}),
        },
      );

      sessionStorage.setItem(TOKEN_KEY, result.accessToken);
      setCustomer(result.user);
    },
    [],
  );

  const updateProfile = useCallback(
    async (data: {
      name: string;
      email: string;
      phone: string;
    }) => {
      const token = sessionStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error(
          "Please sign in again to update your profile.",
        );
      }

      const updatedCustomer = await request<Customer>(
        "/auth/customer/me",
        data,
        token,
      );

      setCustomer(updatedCustomer);
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        customer,
        loading,
        login,
        googleLogin,
        linkGoogleAccount,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
