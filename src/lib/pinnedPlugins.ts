"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "funpay_pinned_plugins";

export type PluginDef = {
  slug: string;
  name: string;
  path: string;
  available: boolean;
};

export const ALL_PLUGINS: PluginDef[] = [
  { slug: "smm", name: "SMM-накрутка", path: "/platform/plugins/smm", available: true },
  { slug: "robux", name: "Robux / Stars", path: "/platform/plugins", available: false },
  { slug: "steam", name: "Аренда Steam", path: "/platform/plugins/steam", available: true },
  { slug: "keys", name: "Ключи и коды", path: "/platform/plugins", available: false },
];

export function usePinnedPlugins() {
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPinned(JSON.parse(stored));
    } catch {}
  }, []);

  const save = (slugs: string[]) => {
    setPinned(slugs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    } catch {}
  };

  const pin = (slug: string) => {
    if (!pinned.includes(slug)) save([...pinned, slug]);
  };

  const unpin = (slug: string) => {
    save(pinned.filter((s) => s !== slug));
  };

  const toggle = (slug: string) => {
    if (pinned.includes(slug)) unpin(slug);
    else pin(slug);
  };

  const isPinned = (slug: string) => pinned.includes(slug);

  return { pinned, pin, unpin, toggle, isPinned };
}
