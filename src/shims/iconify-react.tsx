'use client';

import React from 'react';
import {
  ArrowRight,
  ArrowUp,
  BellRing,
  BookOpen,
  Circle,
  FileText,
  LayoutGrid,
  Menu,
  MessageCircle,
  Moon,
  PenSquare,
  PhoneCall,
  PlayCircle,
  Search,
  Send,
  ShieldCheck,
  StopCircle,
  Sun,
  UserPlus,
  Users,
} from 'lucide-react';

type IconProps = {
  icon?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
};

function resolveIcon(icon?: string) {
  const name = (icon || '').toLowerCase();

  if (name.includes('menu-2')) return Menu;
  if (name.includes('moon')) return Moon;
  if (name.includes('sun')) return Sun;
  if (name.includes('bell-ringing')) return BellRing;
  if (name.includes('magnifer')) return Search;
  if (name.includes('arrow-right')) return ArrowRight;
  if (name.includes('arrow-up')) return ArrowUp;
  if (name.includes('document-text')) return FileText;
  if (name.includes('telegram')) return Send;
  if (name.includes('chat-round-call')) return PhoneCall;
  if (name.includes('chat-round')) return MessageCircle;
  if (name.includes('book')) return BookOpen;
  if (name.includes('pen-new-square')) return PenSquare;
  if (name.includes('stop-circle')) return StopCircle;
  if (name.includes('user-plus')) return UserPlus;
  if (name.includes('users-group')) return Users;
  if (name.includes('play-circle')) return PlayCircle;
  if (name.includes('shield-check')) return ShieldCheck;
  if (name.includes('component')) return LayoutGrid;

  return Circle;
}

function toSize(value?: number | string) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

export function Icon({ icon, className, width, height }: IconProps) {
  const LucideIcon = resolveIcon(icon);
  const size = toSize(width) || toSize(height) || 18;
  return <LucideIcon className={className} size={size} aria-hidden="true" />;
}

