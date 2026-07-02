"use client";
import React, { useEffect, useRef, useState,useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  GroupIcon,
  BoxIcon,
  DollarLineIcon,
  PlugInIcon,
  ChatIcon,
  ChartBarIcon,
  CpuChipIcon,
  WrenchScrewdriverIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UserPlusIcon,
  TaskIcon,
  ServerStackIcon,
  PaperPlaneIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";
import { usePinnedPlugins, ALL_PLUGINS } from "@/lib/pinnedPlugins";
import { settingsApi } from "@/lib/api";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  badge?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const BASE = "/platform";

const mainNavItems: NavItem[] = [
  {
    icon: <GridIcon className="h-5 w-5" />,
    name: "Главная",
    path: `${BASE}/dashboard`,
  },
  {
    icon: <ChatIcon className="h-5 w-5" />,
    name: "Чаты",
    path: `${BASE}/chats`,
    badge: "BETA",
  },
  {
    icon: <ListIcon className="h-5 w-5" />,
    name: "Заказы",
    path: `${BASE}/orders`,
  },
  {
    icon: <BoxCubeIcon className="h-5 w-5" />,
    name: "Лоты",
    path: `${BASE}/lots`,
  },
  {
    icon: <BoxIcon className="h-5 w-5" />,
    name: "Склад",
    path: `${BASE}/warehouse`,
  },
];

const managementNavItems: NavItem[] = [
  {
    icon: <GroupIcon className="h-5 w-5" />,
    name: "Аккаунты",
    path: `${BASE}/accounts`,
  },
  {
    icon: <ServerStackIcon className="h-5 w-5" />,
    name: "Мои прокси",
    path: `${BASE}/proxies`,
  },
  {
    icon: <ChartBarIcon className="h-5 w-5" />,
    name: "Аналитика",
    path: `${BASE}/analytics`,
  },
  {
    icon: <CpuChipIcon className="h-5 w-5" />,
    name: "AI-Ассистент",
    path: `${BASE}/ai-assistant`,
  },
  {
    icon: <PaperPlaneIcon className="h-5 w-5" />,
    name: "Интеграции",
    path: `${BASE}/integrations`,
  },
  {
    icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
    name: "Конструктор",
    path: `${BASE}/constructor`,
  },
  {
    icon: <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />,
    name: "Тест-чат",
    path: `${BASE}/test-chat`,
  },
  {
    icon: <TaskIcon className="h-5 w-5" />,
    name: "Задачи",
    path: `${BASE}/tasks`,
  },
  {
    icon: <PlugInIcon className="h-5 w-5" />,
    name: "Плагины",
    subItems: [],
  },
  {
    icon: <DollarLineIcon className="h-5 w-5" />,
    name: "Финансы",
    path: `${BASE}/finances`,
  },
  {
    icon: <UserPlusIcon className="h-5 w-5" />,
    name: "Реферальная система",
    path: `${BASE}/referral`,
  },
];

const navItems = mainNavItems;
const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const { pinned } = usePinnedPlugins();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    settingsApi.getProfile().then((p) => setIsAdmin(Boolean(p.is_admin))).catch(() => {});
  }, []);

  const pinnedPluginSubItems = [
    ...ALL_PLUGINS
      .filter((p) => pinned.includes(p.slug))
      .map((p) => ({ name: p.name, path: p.path })),
    { name: "Маркетплейс плагинов", path: `${BASE}/plugins` },
  ];

  const dynamicManagementNavItems = managementNavItems.map((item) =>
    item.name === "Плагины"
      ? { ...item, subItems: pinnedPluginSubItems }
      : item
  );

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-1">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : nav.path ? (
            <Link
              href={nav.path}
              onClick={() => { if (isMobileOpen) toggleMobileSidebar(); }}
              className={`menu-item group ${
                isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
              }`}
            >
              <span
                className={`${
                  isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && nav.badge && (
                <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  nav.badge === "Скоро"
                    ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    : "bg-brand-500/10 text-brand-500"
                }`}>
                  {nav.badge}
                </span>
              )}
            </Link>
          ) : (
            /* Пункт без пути — недоступен, только отображается */
            <div className="menu-item group opacity-50 cursor-not-allowed select-none text-gray-700 dark:text-gray-300">
              <span className="menu-item-icon-inactive">{nav.icon}</span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && nav.badge && (
                <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  nav.badge === "Скоро"
                    ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    : "bg-brand-500/10 text-brand-500"
                }`}>
                  {nav.badge}
                </span>
              )}
            </div>
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-[height] duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      onClick={() => { if (isMobileOpen) toggleMobileSidebar(); }}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    const menuMap: Array<["main" | "others", NavItem[]]> = [
      ["main", mainNavItems],
      ["others", dynamicManagementNavItems],
    ];
    menuMap.forEach(([menuType, items]) => {
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType, index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, pinned]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex w-[290px] flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-[width,transform] duration-300 ease-in-out z-50 border-r border-gray-200 overflow-hidden [backface-visibility:hidden] [will-change:width] lg:w-[var(--p2-sidebar-width)]
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/branding/logo_full_new.svg"
                alt="FunPay Cloud"
                width={162}
                height={26}
              />
              <Image
                className="hidden dark:block"
                src="/branding/logo_full_new_dark.svg"
                alt="FunPay Cloud"
                width={162}
                height={26}
              />
            </>
          ) : (
            <>
              <Image
                className="dark:hidden"
                src="/branding/logo_short_new.svg"
                alt="FunPay Cloud"
                width={28}
                height={24}
              />
              <Image
                className="hidden dark:block"
                src="/branding/logo_short_new_dark.svg"
                alt="FunPay Cloud"
                width={28}
                height={24}
              />
            </>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Операции"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(mainNavItems, "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Управление"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(dynamicManagementNavItems, "others")}
            </div>

            {isAdmin && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? "Dev" : <HorizontaLDots />}
                </h2>
                <ul className="flex flex-col gap-1">
                  <li>
                    <Link
                      href={`${BASE}/reviews`}
                      onClick={() => { if (isMobileOpen) toggleMobileSidebar(); }}
                      className={`menu-item group ${isActive(`${BASE}/reviews`) ? "menu-item-active" : "menu-item-inactive"}`}
                    >
                      <span className={`${isActive(`${BASE}/reviews`) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="menu-item-text">Отзывы</span>
                      )}
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                          DEV
                        </span>
                      )}
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
