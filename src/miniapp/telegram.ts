export type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: {
    user?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
  };
  version?: string;
  platform?: string;
  isFullscreen?: boolean;
  ready?: () => void;
  expand?: () => void;
  requestFullscreen?: () => void;
  enableClosingConfirmation?: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
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

export function setupTelegramViewport() {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  try {
    webApp.ready?.();
    webApp.expand?.();
    webApp.enableClosingConfirmation?.();
    webApp.disableVerticalSwipes?.();
    webApp.setHeaderColor?.("#070b12");
    webApp.setBackgroundColor?.("#070b12");
    webApp.setBottomBarColor?.("#070b12");
    if (!webApp.isFullscreen) {
      webApp.requestFullscreen?.();
    }
  } catch {
    webApp.expand?.();
  }
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
