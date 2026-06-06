"use client";
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import {
  Cog8ToothIcon,
  CreditCardIcon,
  TagIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { authApi } from "@/lib/api";
import { logout } from "@/lib/auth";

const menuItems = [
  { label: "Настройки",  icon: Cog8ToothIcon,           href: "/platform2/settings" },
  { label: "Подписка",   icon: CreditCardIcon,           href: "/platform2/subscription" },
  { label: "Промокоды",  icon: TagIcon,                  href: "/platform2/promo-codes" },
  { label: "Поддержка @fpcloud_support",  icon: QuestionMarkCircleIcon,   href: "https://t.me/fpcloud_support" },
];

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("Профиль");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    authApi.me().then((p) => {
      setUserEmail(p.email || "");
      setUserName(p.email ? p.email.split("@")[0] : "Профиль");
    }).catch(() => {});
  }, []);

  const userInitials = userName.slice(0, 2).toUpperCase();

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="dropdown-toggle flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.05]"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
          {userInitials}
        </span>
        <span className="max-w-[80px] truncate">{userName}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-900"
      >
        {/* User info */}
        <div className="border-b border-gray-100 px-4 pb-3 pt-1 dark:border-gray-800">
          <p className="font-semibold text-gray-800 dark:text-white">{userName}</p>
          <p className="mt-0.5 text-xs text-gray-500">{userEmail}</p>
        </div>

        {/* Menu items */}
        <div className="py-1">
          {menuItems.map(({ label, icon: Icon, href }) => (
            <DropdownItem
              key={label}
              onItemClick={closeDropdown}
              tag="a"
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Icon className="h-5 w-5 text-gray-400" />
              {label}
            </DropdownItem>
          ))}
        </div>

        {/* Sign out */}
        <div className="border-t border-gray-100 pt-1 dark:border-gray-800">
          <DropdownItem
            onItemClick={() => { closeDropdown(); logout(); }}
            tag="button"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Выйти
          </DropdownItem>
        </div>
      </Dropdown>
    </div>
  );
}
