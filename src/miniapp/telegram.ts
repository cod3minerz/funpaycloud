export type TelegramWebApp = {
  initData: string;
  ready?: () => void;
  expand?: () => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred?: (type: "error" | "success" | "warning") => void;
    selectionChanged?: () => void;
  };
};

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  const telegram = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram;
  return telegram?.WebApp ?? null;
}

export function openTelegramLink(url: string) {
  const webApp = getTelegramWebApp();
  if (webApp?.openLink) {
    webApp.openLink(url);
    return;
  }
  window.location.href = url;
}

export function haptic(type: "success" | "warning" | "error" | "light" = "light") {
  const feedback = getTelegramWebApp()?.HapticFeedback;
  if (!feedback) return;
  if (type === "success" || type === "warning" || type === "error") {
    feedback.notificationOccurred?.(type);
    return;
  }
  feedback.impactOccurred?.("light");
}
