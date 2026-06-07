"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuthStore } from "@/store/authStore";

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (values: FormState): FormErrors => {
    const errs: FormErrors = {};
    if (!values.email) {
      errs.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      errs.email = "Please enter a valid email";
    }
    if (!values.password) {
      errs.password = "Password is required";
    }
    return errs;
  };

  const handleChange = (field: keyof FormState, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      const fieldErrors = validate(updated);
      setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
    }
    if (error) clearError();
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldErrors = validate(form);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(validationErrors).length > 0) return;

    try {
      await login(form);
      router.push("/feed");
    } catch {
      // Error is handled by store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-dark-600 bg-dark-800/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-dark-50">SnapConnect</h1>
            <p className="mt-2 text-sm text-dark-400">
              Sign in to see what your friends share
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                error={touched.email ? errors.email : undefined}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  error={touched.password ? errors.password : undefined}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-dark-400 hover:text-dark-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              <LogIn size={18} className="mr-2" />
              Log in
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-sm text-dark-500">
            <div className="h-px flex-1 bg-dark-600" />
            <span>OR</span>
            <div className="h-px flex-1 bg-dark-600" />
          </div>

          <p className="mt-6 text-center text-sm text-dark-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary-500 hover:text-primary-400 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
