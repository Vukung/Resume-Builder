import {
  User,
  Resume,
  ResumeSummary,
  ResumeContent,
  ApiErrorPayload,
  ApiErrorField,
} from "./types";

export class ApiError extends Error {
  status: number;
  fields?: ApiErrorField[];

  constructor(status: number, message: string, fields?: ApiErrorField[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

type SlowServerListener = (isSlow: boolean) => void;
const slowListeners = new Set<SlowServerListener>();
let activeSlowCount = 0;
let isSlowActive = false;

function setSlow(slow: boolean) {
  if (isSlowActive !== slow) {
    isSlowActive = slow;
    slowListeners.forEach((fn) => fn(slow));
  }
}

export function subscribeSlowServer(listener: SlowServerListener): () => void {
  slowListeners.add(listener);
  listener(isSlowActive);
  return () => {
    slowListeners.delete(listener);
  };
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface RequestOptions extends RequestInit {
  isInitialMe?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 70000);

  let slowTriggered = false;
  const slowTimer = setTimeout(() => {
    slowTriggered = true;
    activeSlowCount++;
    setSlow(true);
  }, 4000);

  const headers = new Headers(options.headers || {});
  if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      let payload: ApiErrorPayload | null = null;
      try {
        payload = (await res.json()) as ApiErrorPayload;
      } catch {
        // non-JSON error
      }

      const status = res.status;
      let message = payload?.error || `Request failed with status ${status}`;

      if (status === 429 && !path.startsWith("/api/auth/demo")) {
        message = "Too many attempts, please try again in a few minutes.";
      }

      // Handle global 401 if not login, signup, or initial me
      const isLoginOrSignup =
        path.startsWith("/api/auth/login") ||
        path.startsWith("/api/auth/signup") ||
        path.startsWith("/api/auth/demo");
      const isInitialMe = options.isInitialMe;

      if (status === 401 && !isLoginOrSignup && !isInitialMe) {
        unauthorizedHandler?.();
      }

      throw new ApiError(status, message, payload?.fields);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }

    if (err && typeof err === "object" && (err as { name?: string }).name === "AbortError") {
      throw new ApiError(0, "Request timed out. Please try again.");
    }

    throw new ApiError(0, "Network error. Could not connect to server.");
  } finally {
    clearTimeout(timeoutId);
    clearTimeout(slowTimer);
    if (slowTriggered) {
      activeSlowCount = Math.max(0, activeSlowCount - 1);
      if (activeSlowCount === 0) {
        setSlow(false);
      }
    }
  }
}

export const api = {
  // Auth
  signup: (data: { email: string; name: string; password: string }) =>
    request<{ user: User }>("/api/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),

  startDemo: () =>
    request<{ user: User; resumeId: string }>("/api/auth/demo", { method: "POST" }),

  logout: () =>
    request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  me: (isInitial = false) =>
    request<{ user: User }>("/api/auth/me", { method: "GET", isInitialMe: isInitial }),

  // Resumes
  listResumes: (q?: string) => {
    const queryStr = q ? `?q=${encodeURIComponent(q)}` : "";
    return request<{ resumes: ResumeSummary[] }>(`/api/resumes${queryStr}`, {
      method: "GET",
    });
  },

  createResume: (title: string) =>
    request<{ resume: Resume }>("/api/resumes", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  getResume: (id: string) =>
    request<{ resume: Resume }>(`/api/resumes/${id}`, {
      method: "GET",
    }),

  renameResume: (id: string, title: string) =>
    request<{ resume: ResumeSummary }>(`/api/resumes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),

  saveContent: (id: string, content: ResumeContent) =>
    request<{ updatedAt: string }>(`/api/resumes/${id}/content`, {
      method: "PUT",
      body: JSON.stringify(content),
    }),

  duplicateResume: (id: string) =>
    request<{ resume: Resume }>(`/api/resumes/${id}/duplicate`, {
      method: "POST",
    }),

  deleteResume: (id: string) =>
    request<{ ok: boolean }>(`/api/resumes/${id}`, {
      method: "DELETE",
    }),
};
