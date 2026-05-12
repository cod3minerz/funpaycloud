"use client";
import React from "react";
import { ChevronDownIcon } from "@/platform2/icons";

interface SelectProps {
  children?: React.ReactNode;
  className?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  value?: string;
}

const Select: React.FC<SelectProps> = ({
  children,
  className = "",
  onChange,
  defaultValue = "",
  value,
}) => {
  return (
    <div className="relative">
      <select
        className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm shadow-theme-xs text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${className}`}
        defaultValue={value !== undefined ? undefined : defaultValue}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
        <ChevronDownIcon className="h-4 w-4" />
      </span>
    </div>
  );
};

export default Select;
export { Select };
