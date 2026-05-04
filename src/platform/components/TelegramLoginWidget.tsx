'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

import type { TelegramAuthPayload } from '@/lib/api';

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthPayload) => void;
  }
}

type TelegramLoginWidgetProps = {
  botUsername: string;
  onAuth: (user: TelegramAuthPayload) => void;
};

export function TelegramLoginWidget({ botUsername, onAuth }: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !botUsername) return undefined;

    setLoading(true);
    setLoadError(null);
    container.innerHTML = '';

    window.onTelegramAuth = (user: TelegramAuthPayload) => {
      onAuth(user);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-lang', 'ru');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.onload = () => {
      setLoading(false);
    };
    script.onerror = () => {
      setLoading(false);
      setLoadError('Не удалось загрузить Telegram Login Widget');
    };

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
      if (window.onTelegramAuth) {
        delete window.onTelegramAuth;
      }
    };
  }, [botUsername, onAuth]);

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="flex min-h-11 items-center justify-center rounded-xl border border-dashed border-[var(--pf-border)] bg-[var(--pf-elevated)] px-4 py-3" />
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--pf-text-dim)]">
          <Loader2 size={14} className="animate-spin" />
          Загружаем Telegram Login Widget...
        </div>
      ) : null}
      {loadError ? <p className="text-xs text-red-400">{loadError}</p> : null}
    </div>
  );
}
