"use client";

import React, { useEffect, useState } from "react";

const STORAGE_KEY = "tg_channel_banner_dismissed_until";
const DISMISS_DAYS = 7;
const TG_CHANNEL_URL = "https://t.me/fpcloud_news";

export function TelegramChannelBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const until = localStorage.getItem(STORAGE_KEY);
      if (until && Date.now() < Number(until)) return;
    } catch {
      // ignore
    }
    setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, String(until));
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <div className="relative flex items-center justify-between gap-3 border-b border-blue-200 bg-blue-50 px-4 py-2.5 text-sm dark:border-blue-900/40 dark:bg-blue-900/15 sm:px-6">
      <div className="flex items-center gap-2.5">
        {/* Telegram icon */}
        <svg className="h-4 w-4 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        <p className="font-medium text-blue-700 dark:text-blue-300">
          Подпишись на наш канал — новые фичи, советы и промокоды:
          <a
            href={TG_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-100"
          >
            @fpcloud_news
          </a>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <a
          href={TG_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="whitespace-nowrap rounded-md bg-blue-500 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
        >
          Подписаться
        </a>
        <button
          onClick={dismiss}
          aria-label="Закрыть"
          className="flex h-6 w-6 items-center justify-center rounded-full text-blue-400 opacity-70 transition-opacity hover:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
