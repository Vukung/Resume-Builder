import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError } from "../api/client";

describe("API client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("throws ApiError carrying status and field errors from a server error response", async () => {
    const errorPayload = {
      error: "Validation failed",
      fields: [{ path: "email", message: "Invalid email format" }],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => errorPayload,
    } as unknown as Response);

    await expect(api.signup({ name: "Alex", email: "invalid", password: "pwd" })).rejects.toSatisfy(
      (err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(400);
        expect(apiErr.message).toBe("Validation failed");
        expect(apiErr.fields).toEqual([{ path: "email", message: "Invalid email format" }]);
        return true;
      }
    );
  });

  it("maps a network failure to status 0", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(api.login({ email: "user@example.com", password: "password123" })).rejects.toSatisfy(
      (err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(0);
        expect(apiErr.message).toBe("Network error. Could not connect to server.");
        return true;
      }
    );
  });

  it("maps 429 status code to specific friendly message", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: "Too many requests" }),
    } as unknown as Response);

    await expect(api.login({ email: "user@example.com", password: "password123" })).rejects.toSatisfy(
      (err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(429);
        expect(apiErr.message).toBe("Too many attempts, please try again in a few minutes.");
        return true;
      }
    );
  });
});
