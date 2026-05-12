"use client";
import React from "react";
import BadgeBase from "./badge/Badge";

type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

const variantToColor: Record<string, BadgeColor> = {
  success: "success",
  warning: "warning",
  danger: "error",
  error: "error",
  primary: "primary",
  secondary: "light",
  info: "info",
  light: "light",
  dark: "dark",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

export function Badge({ children, variant = "primary", className }: BadgeProps) {
  const color = variantToColor[variant] ?? "primary";
  return (
    <BadgeBase color={color} variant="light">
      {children}
    </BadgeBase>
  );
}

export default Badge;
