"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuthStore } from "@/store/authStore";

interface FormState {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState<FormState>({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (values: FormState): FormErrors => {
    const errs: FormErrors = {};

    if (!values.fullName.trim()) {
      errs.fullName = "Full name is required";
    } else if (values.fullName.length > 50) {
      errs.fullName = "Full name must be at most 50 characters";
    }

    if (!values.username.trim()) {
      errs.username = "Username is required";
    } else if (values.username.length < 3) {
      errs.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(values.username)) {
      errs.username = "Only letters, numbers, and underscores";
    }

    if (!values.email) {
      errs.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      errs.email = "Please enter a valid email";
    }

    if (!values.password) {
      errs.password = "Password is required";
    } else if (values.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    } else {
      if (!/[A-Z]/.test(values.password))
        errs.password = "Needs an uppercase letter";
      else if (!/[a-z]/.test(values.password))
        errs.password = "Needs a lowercase letter";
      else if (!/[0-9]/.test(values.password))
        errs.password = "Needs a number";
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
    setTouched({ fullName: true, username: true, email: true, password: true });

    if (Object.keys(validationErrors).length > 0) return;

    try {
      await register(form);
      router.push("/feed");
    } catch {
      // Error is handled by store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-dark-600 bg-dark-800/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-dark-50">SnapConnect</h1>
            <p className="mt-2 text-sm text-dark-400">
              Create an account and start sharing
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="fullName"
              label="Full Name"
              placeholder="John Doe"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              onBlur={() => handleBlur("fullName")}
              error={touched.fullName ? errors.fullName : undefined}
              autoComplete="name"
              required
            />

            <Input
              id="username"
              label="Username"
              placeholder="johndoe"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              onBlur={() => handleBlur("username")}
              error={touched.username ? errors.username : undefined}
              autoComplete="username"
              required
            />

            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="john@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              error={touched.email ? errors.email : undefined}
              autoComplete="email"
              required
            />

            <div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  error={touched.password ? errors.password : undefined}
                  autoComplete="new-password"
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
              {touched.password && !errors.password && form.password && (
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dark-400">
                  <span className={form.password.length >= 8 ? "text-green-500" : ""}>
                    {form.password.length >= 8 ? "✓" : "○"} 8+ chars
                  </span>
                  <span className={/[A-Z]/.test(form.password) ? "text-green-500" : ""}>
                    {/[A-Z]/.test(form.password) ? "✓" : "○"} Uppercase
                  </span>
                  <span className={/[a-z]/.test(form.password) ? "text-green-500" : ""}>
                    {/[a-z]/.test(form.password) ? "✓" : "○"} Lowercase
                  </span>
                  <span className={/[0-9]/.test(form.password) ? "text-green-500" : ""}>
                    {/[0-9]/.test(form.password) ? "✓" : "○"} Number
                  </span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              <UserPlus size={18} className="mr-2" />
              Sign up
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary-500 hover:text-primary-400 transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
