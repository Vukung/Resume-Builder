import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ApiError } from "../api/client";
import { Rocket, Loader2, AlertCircle } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerFieldErrors({});

    const errors = validate();
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message);
        if (err.fields) {
          const fieldMap: { [key: string]: string } = {};
          err.fields.forEach((f) => {
            fieldMap[f.path] = f.message;
          });
          setServerFieldErrors(fieldMap);
        }
      } else {
        setServerError("Failed to log in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailError = clientErrors.email || serverFieldErrors.email;
  const passwordError = clientErrors.password || serverFieldErrors.password;

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-card border border-border rounded-lg shadow-xs p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent text-white mb-3">
            <Rocket className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Resume Rocket</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Build clean, job-winning resumes in minutes
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-md bg-destructive-subtle border border-destructive/20 text-destructive text-sm flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (clientErrors.email) setClientErrors((prev) => ({ ...prev, email: undefined }));
              }}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 text-sm border rounded-md bg-surface text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 ${
                emailError ? "border-destructive focus:ring-destructive" : "border-border focus:ring-accent"
              }`}
              placeholder="you@example.com"
            />
            {emailError && <p className="mt-1 text-xs text-destructive">{emailError}</p>}
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (clientErrors.password) setClientErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 text-sm border rounded-md bg-surface text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 ${
                passwordError ? "border-destructive focus:ring-destructive" : "border-border focus:ring-accent"
              }`}
              placeholder="At least 8 characters"
            />
            {passwordError && <p className="mt-1 text-xs text-destructive">{passwordError}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Sign In</span>
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-foreground-muted">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-accent hover:text-accent-hover focus:outline-none focus:ring-2 focus:ring-accent rounded px-1"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
