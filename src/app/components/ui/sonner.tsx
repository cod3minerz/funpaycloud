"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const platformToastClassNames: NonNullable<ToasterProps["toastOptions"]>["classNames"] = {
  toast:
    "font-[var(--font-outfit)] rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300",
  title: "text-sm font-semibold text-gray-900 dark:text-white",
  description: "text-sm text-gray-500 dark:text-gray-400",
  actionButton:
    "rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600",
  cancelButton:
    "rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300",
  closeButton:
    "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400",
};

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...platformToastClassNames,
          ...toastOptions?.classNames,
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#344054",
          "--normal-border": "#e4e7ec",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
