"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-dark-300"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-dark-900 px-3 py-2.5 text-sm text-dark-50 placeholder-dark-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0",
          error
            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
            : "border-dark-600 hover:border-dark-500 focus:border-primary-500 focus:ring-primary-500/20",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
);

Input.displayName = "Input";
