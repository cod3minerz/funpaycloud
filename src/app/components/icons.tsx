'use client';

import type { CSSProperties, SVGProps } from 'react';
import streamlineIcons from '@iconify-json/streamline/icons.json';

type StreamlineIconName = string;
type StreamlineIconData = { body: string; width?: number; height?: number };

const icons = streamlineIcons.icons as Record<string, StreamlineIconData>;

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
  size?: number | string;
  active?: boolean;
  absoluteStrokeWidth?: boolean;
  strokeWidth?: number | string;
};

export type LucideIcon = (props: IconProps) => JSX.Element;

const DEFAULT_SIZE = 24;

const iconMap = {
  Activity: 'dashboard-3',
  AlertCircle: 'interface-alert-warning-circle-warning-alert-frame-exclamation-caution-circle',
  AlertTriangle: 'warning-triangle',
  ArrowLeft: 'arrow-round-left',
  ArrowRight: 'arrow-round-right',
  ArrowUpCircle: 'interface-arrows-up-circle-1-arrow-up-keyboard-circle-button',
  BadgeDollarSign: 'discount-percent-badge',
  Ban: 'interface-user-block-actions-block-close-denied-deny-geometric-human-person-single-up-user',
  BarChart2: 'money-graph-bar-product-data-bars-analysis-analytics-graph-business-chart',
  BarChart3: 'interface-content-chart-product-data-analysis-analytics-graph-line-business-board-chart',
  Bell: 'interface-alert-alarm-bell-2-alert-bell-ring-notification-alarm',
  BookOpen: 'open-book',
  Bot: 'computer-robot-cyborg-artificial-robotics-robot-intelligence-machine-technology-android',
  Boxes: 'shipping-box-2-box-package-label-delivery-shipment-shipping-3d',
  Bug: 'bug',
  Cable: 'computer-connection-cable-split-cables-cable-split-device-computer-electronics-cords-cord-splitter',
  ChartNoAxesCombined: 'money-graph-bar-increase-up-product-performance-increase-arrow-graph-business-chart',
  Check: 'check',
  CheckCheck: 'clipboard-check',
  CheckCircle2: 'check-square',
  CheckIcon: 'check',
  ChevronDown: 'interface-arrows-button-down-arrow-down-keyboard',
  ChevronDownIcon: 'interface-arrows-button-down-arrow-down-keyboard',
  ChevronLeft: 'interface-arrows-button-left-arrow-keyboard-left',
  ChevronLeftIcon: 'interface-arrows-button-left-arrow-keyboard-left',
  ChevronRight: 'interface-arrows-button-right-arrow-right-keyboard',
  ChevronRightIcon: 'interface-arrows-button-right-arrow-right-keyboard',
  ChevronUp: 'interface-arrows-button-up-arrow-up-keyboard',
  ChevronUpIcon: 'interface-arrows-button-up-arrow-up-keyboard',
  CircleCheck: 'check-square',
  CircleDashed: 'circle-clock',
  CircleDollarSign: 'dollar-coin',
  CircleIcon: 'circle',
  Clock: 'circle-clock',
  Copy: 'copy-paste',
  CreditCard: 'credit-card-1',
  Crown: 'crown',
  Download: 'download-box-1',
  Edit2: 'pencil',
  Eye: 'interface-edit-view-eye-eyeball-open-view',
  EyeOff: 'interface-edit-view-off-disable-eye-eyeball-hide-off-view',
  FileText: 'interface-file-text-text-common-file',
  Filter: 'filter-2',
  FolderKanban: 'interface-file-folder-work-office-company-folder-supplies-file',
  Gift: 'gift',
  GitMerge: 'interface-arrows-data-transfer-diagonal-square-arrow-square-data-diagonal-internet-transfer-network',
  GripVerticalIcon: 'interface-setting-menu-vertical-navigation-vertical-three-circle-button-menu-dots',
  Handshake: 'business-handshake',
  Headphones: 'interface-help-customer-support-2-customer-headphones-headset-help-microphone-phone-person-support',
  HelpCircle: 'help-question-1',
  History: 'medical-files-report-history',
  Home: 'home-3',
  Info: 'information-circle',
  KeyRound: 'key',
  LayoutDashboard: 'dashboard-3',
  LifeBuoy: 'travel-wayfinder-lifebuoy-water-life-ring-wheely-lifebelt-kisbee',
  Lightbulb: 'lightbulb',
  Link2: 'link-chain',
  Loader2: 'arrow-reload-horizontal-1',
  Lock: 'interface-lock-combination-combo-lock-locked-padlock-secure-security-shield-keyhole',
  LogIn: 'login-1',
  LogOut: 'logout-1',
  Logs: 'log',
  Menu: 'interface-setting-menu-1-button-parallel-horizontal-lines-menu-navigation-three-hamburger',
  MessageCircle: 'chat-bubble-oval',
  MessageSquare: 'chat-bubble-text-square',
  MessageSquareCode: 'programming-browser-code-2-code-browser-tags-angle-programming-bracket',
  MessageSquareQuote: 'chat-bubble-square-question',
  MinusIcon: 'interface-remove-square-subtract-buttons-remove-add-button-square-delete',
  MonitorSmartphone: 'computer-monitor-screen-desktop-monitor-device-electronics-display-computer',
  Moon: 'interface-weather-cresent-moon-1-night-new-moon-crescent-weather-time-waning',
  MoreHorizontal: 'interface-setting-menu-horizontal-navigation-dots-three-circle-button-horizontal-menu',
  MoreHorizontalIcon: 'interface-setting-menu-horizontal-navigation-dots-three-circle-button-horizontal-menu',
  MousePointerClick: 'interface-cursor-arrow-1-mouse-select-cursor',
  Network: 'network',
  Package: 'shipping-box-1-box-package-label-delivery-shipment-shipping',
  PackageOpen: 'mail-inbox-email-outbox-drawer-empty-open-inbox',
  PanelLeft: 'interface-layout-9-column-layout-layouts-left-sidebar',
  PanelLeftIcon: 'interface-layout-9-column-layout-layouts-left-sidebar',
  Pause: 'button-pause-2',
  Pencil: 'pencil',
  Percent: 'discount-percent-coupon',
  Play: 'button-play',
  PlayCircle: 'entertainment-control-button-play-circle-controls-media-multi-play-multimedia-button-circle',
  Plus: 'add-1',
  Power: 'button-power-1',
  Puzzle: 'module-puzzle-1',
  RefreshCw: 'cloud-refresh',
  RotateCcw: 'interface-time-reset-time-clock-reset-stopwatch-circle-measure-loading',
  Save: 'interface-content-save-disk-floppy-electronics-device-disc-computer',
  Search: 'interface-search-glass-search-magnifying',
  SearchIcon: 'interface-search-glass-search-magnifying',
  SearchX: 'interface-search-square-glass-search-square-magnifying',
  Send: 'mail-send-email-message',
  SendHorizontal: 'mail-send-forward-email-email-send-message-envelope-actions-action-forward-arrow',
  Settings: 'interface-setting-cog-work-loading-cog-gear-settings-machine',
  Settings2: 'interface-setting-slider-horizontal-adjustment-adjust-controls-fader-horizontal-settings-slider',
  Share2: 'share-link',
  Shield: 'shield-1',
  ShieldCheck: 'shield-check',
  ShoppingBag: 'shopping-bag-hand-bag-2',
  ShoppingCart: 'shopping-cart-1',
  Sparkles: 'ai-technology-spark',
  Square: 'interface-geometric-square-square-geometric-design-shape-shapes',
  SquareStack: 'interface-layout-border-center-border-cell-format-formatting-horizontal-vertical',
  Sun: 'interface-weather-sun-photos-light-camera-mode-brightness-sun-photo-full',
  Tag: 'tag',
  Tags: 'tag-alt',
  Ticket: 'ticket-1',
  Trash2: 'interface-delete-bin-1-remove-delete-empty-bin-trash-garbage',
  TrendingUp: 'trending-content',
  TriangleAlert: 'warning-triangle',
  Upload: 'interface-upload-box-1-arrow-box-download-internet-network-server-up-upload',
  User: 'interface-user-human-geometric-human-person-single-user',
  Users: 'interface-user-multiple-close-geometric-human-multiple-person-up-user',
  Wallet: 'wallet',
  Workflow: 'interface-page-controller-settings-page-setting-square-triangle-circle-line-combination-variation',
  Wrench: 'wrench',
  X: 'interface-delete-square-button-remove-buttons-add-square-delete',
  XCircle: 'warning-octagon',
  XIcon: 'interface-delete-square-button-remove-buttons-add-square-delete',
  Zap: 'ai-cloud-spark',
} as const satisfies Record<string, StreamlineIconName>;

const variantMap = {
  dashboard: 'dashboard-3',
  home: 'home-3',
  chats: 'chat-bubble-text-square',
  orders: 'shopping-cart-1',
  lots: 'tag',
  warehouse: 'warehouse-1',
  accounts: 'interface-user-human-geometric-human-person-single-user',
  constructor: 'interface-page-controller-settings-page-setting-square-triangle-circle-line-combination-variation',
  analytics: 'money-graph-bar-product-data-bars-analysis-analytics-graph-business-chart',
  ai: 'ai-technology-spark',
  plugins: 'module-puzzle-1',
  finances: 'wallet',
  referrals: 'money-cash-bag-dollar-bag-payment-cash-money-finance',
} as const satisfies Record<string, StreamlineIconName>;

function getVariantName(name: StreamlineIconName, active?: boolean): StreamlineIconName {
  const candidate = `${name}${active ? '-solid' : '-remix'}` as StreamlineIconName;
  return icons[candidate] ? candidate : name;
}

export function StreamlineIcon({
  name,
  size = DEFAULT_SIZE,
  active,
  className,
  color,
  stroke,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  style,
  ...props
}: IconProps & { name: StreamlineIconName; active?: boolean }) {
  const iconName = getVariantName(name, active);
  const icon = icons[iconName] ?? icons[name];
  const width = icon.width ?? streamlineIcons.width ?? 14;
  const height = icon.height ?? streamlineIcons.height ?? 14;
  const iconStyle: CSSProperties = {
    color: color ?? (typeof stroke === 'string' ? stroke : undefined),
    ...style,
  };

  return (
    <svg
      {...props}
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={props['aria-label'] ? undefined : true}
      focusable="false"
      style={iconStyle}
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}

export function createStreamlineIcon(name: StreamlineIconName): LucideIcon {
  const Icon = ({ active, ...props }: IconProps) => <StreamlineIcon name={name} active={active} {...props} />;
  Icon.displayName = `Streamline.${name}`;
  return Icon;
}

export function createStreamlineNavIcon(name: keyof typeof variantMap): LucideIcon {
  const Icon = ({ 'aria-current': ariaCurrent, ...props }: IconProps) => (
    <StreamlineIcon name={variantMap[name]} active={ariaCurrent === 'page'} {...props} />
  );
  Icon.displayName = `StreamlineNav.${name}`;
  return Icon;
}

export const StreamlineNavIcons = {
  dashboard: createStreamlineNavIcon('dashboard'),
  home: createStreamlineNavIcon('home'),
  chats: createStreamlineNavIcon('chats'),
  orders: createStreamlineNavIcon('orders'),
  lots: createStreamlineNavIcon('lots'),
  warehouse: createStreamlineNavIcon('warehouse'),
  accounts: createStreamlineNavIcon('accounts'),
  constructor: createStreamlineNavIcon('constructor'),
  analytics: createStreamlineNavIcon('analytics'),
  ai: createStreamlineNavIcon('ai'),
  plugins: createStreamlineNavIcon('plugins'),
  finances: createStreamlineNavIcon('finances'),
  referrals: createStreamlineNavIcon('referrals'),
};

export const Activity = createStreamlineIcon(iconMap.Activity);
export const AlertCircle = createStreamlineIcon(iconMap.AlertCircle);
export const AlertTriangle = createStreamlineIcon(iconMap.AlertTriangle);
export const ArrowLeft = createStreamlineIcon(iconMap.ArrowLeft);
export const ArrowRight = createStreamlineIcon(iconMap.ArrowRight);
export const ArrowUpCircle = createStreamlineIcon(iconMap.ArrowUpCircle);
export const BadgeDollarSign = createStreamlineIcon(iconMap.BadgeDollarSign);
export const Ban = createStreamlineIcon(iconMap.Ban);
export const BarChart2 = createStreamlineIcon(iconMap.BarChart2);
export const BarChart3 = createStreamlineIcon(iconMap.BarChart3);
export const Bell = createStreamlineIcon(iconMap.Bell);
export const BookOpen = createStreamlineIcon(iconMap.BookOpen);
export const Bot = createStreamlineIcon(iconMap.Bot);
export const Boxes = createStreamlineIcon(iconMap.Boxes);
export const Bug = createStreamlineIcon(iconMap.Bug);
export const Cable = createStreamlineIcon(iconMap.Cable);
export const ChartNoAxesCombined = createStreamlineIcon(iconMap.ChartNoAxesCombined);
export const Check = createStreamlineIcon(iconMap.Check);
export const CheckCheck = createStreamlineIcon(iconMap.CheckCheck);
export const CheckCircle2 = createStreamlineIcon(iconMap.CheckCircle2);
export const CheckIcon = createStreamlineIcon(iconMap.CheckIcon);
export const ChevronDown = createStreamlineIcon(iconMap.ChevronDown);
export const ChevronDownIcon = createStreamlineIcon(iconMap.ChevronDownIcon);
export const ChevronLeft = createStreamlineIcon(iconMap.ChevronLeft);
export const ChevronLeftIcon = createStreamlineIcon(iconMap.ChevronLeftIcon);
export const ChevronRight = createStreamlineIcon(iconMap.ChevronRight);
export const ChevronRightIcon = createStreamlineIcon(iconMap.ChevronRightIcon);
export const ChevronUp = createStreamlineIcon(iconMap.ChevronUp);
export const ChevronUpIcon = createStreamlineIcon(iconMap.ChevronUpIcon);
export const CircleCheck = createStreamlineIcon(iconMap.CircleCheck);
export const CircleDashed = createStreamlineIcon(iconMap.CircleDashed);
export const CircleDollarSign = createStreamlineIcon(iconMap.CircleDollarSign);
export const CircleIcon = createStreamlineIcon(iconMap.CircleIcon);
export const Clock = createStreamlineIcon(iconMap.Clock);
export const Copy = createStreamlineIcon(iconMap.Copy);
export const CreditCard = createStreamlineIcon(iconMap.CreditCard);
export const Crown = createStreamlineIcon(iconMap.Crown);
export const Download = createStreamlineIcon(iconMap.Download);
export const Edit2 = createStreamlineIcon(iconMap.Edit2);
export const Eye = createStreamlineIcon(iconMap.Eye);
export const EyeOff = createStreamlineIcon(iconMap.EyeOff);
export const FileText = createStreamlineIcon(iconMap.FileText);
export const Filter = createStreamlineIcon(iconMap.Filter);
export const FolderKanban = createStreamlineIcon(iconMap.FolderKanban);
export const Gift = createStreamlineIcon(iconMap.Gift);
export const GitMerge = createStreamlineIcon(iconMap.GitMerge);
export const GripVerticalIcon = createStreamlineIcon(iconMap.GripVerticalIcon);
export const Handshake = createStreamlineIcon(iconMap.Handshake);
export const Headphones = createStreamlineIcon(iconMap.Headphones);
export const HelpCircle = createStreamlineIcon(iconMap.HelpCircle);
export const History = createStreamlineIcon(iconMap.History);
export const Home = createStreamlineIcon(iconMap.Home);
export const Info = createStreamlineIcon(iconMap.Info);
export const KeyRound = createStreamlineIcon(iconMap.KeyRound);
export const LayoutDashboard = createStreamlineIcon(iconMap.LayoutDashboard);
export const LifeBuoy = createStreamlineIcon(iconMap.LifeBuoy);
export const Lightbulb = createStreamlineIcon(iconMap.Lightbulb);
export const Link2 = createStreamlineIcon(iconMap.Link2);
export const Loader2 = createStreamlineIcon(iconMap.Loader2);
export const Lock = createStreamlineIcon(iconMap.Lock);
export const LogIn = createStreamlineIcon(iconMap.LogIn);
export const LogOut = createStreamlineIcon(iconMap.LogOut);
export const Logs = createStreamlineIcon(iconMap.Logs);
export const Menu = createStreamlineIcon(iconMap.Menu);
export const MessageCircle = createStreamlineIcon(iconMap.MessageCircle);
export const MessageSquare = createStreamlineIcon(iconMap.MessageSquare);
export const MessageSquareCode = createStreamlineIcon(iconMap.MessageSquareCode);
export const MessageSquareQuote = createStreamlineIcon(iconMap.MessageSquareQuote);
export const MinusIcon = createStreamlineIcon(iconMap.MinusIcon);
export const MonitorSmartphone = createStreamlineIcon(iconMap.MonitorSmartphone);
export const Moon = createStreamlineIcon(iconMap.Moon);
export const MoreHorizontal = createStreamlineIcon(iconMap.MoreHorizontal);
export const MoreHorizontalIcon = createStreamlineIcon(iconMap.MoreHorizontalIcon);
export const MousePointerClick = createStreamlineIcon(iconMap.MousePointerClick);
export const Network = createStreamlineIcon(iconMap.Network);
export const Package = createStreamlineIcon(iconMap.Package);
export const PackageOpen = createStreamlineIcon(iconMap.PackageOpen);
export const PanelLeft = createStreamlineIcon(iconMap.PanelLeft);
export const PanelLeftIcon = createStreamlineIcon(iconMap.PanelLeftIcon);
export const Pause = createStreamlineIcon(iconMap.Pause);
export const Pencil = createStreamlineIcon(iconMap.Pencil);
export const Percent = createStreamlineIcon(iconMap.Percent);
export const Play = createStreamlineIcon(iconMap.Play);
export const PlayCircle = createStreamlineIcon(iconMap.PlayCircle);
export const Plus = createStreamlineIcon(iconMap.Plus);
export const Power = createStreamlineIcon(iconMap.Power);
export const Puzzle = createStreamlineIcon(iconMap.Puzzle);
export const RefreshCw = createStreamlineIcon(iconMap.RefreshCw);
export const RotateCcw = createStreamlineIcon(iconMap.RotateCcw);
export const Save = createStreamlineIcon(iconMap.Save);
export const Search = createStreamlineIcon(iconMap.Search);
export const SearchIcon = createStreamlineIcon(iconMap.SearchIcon);
export const SearchX = createStreamlineIcon(iconMap.SearchX);
export const Send = createStreamlineIcon(iconMap.Send);
export const SendHorizontal = createStreamlineIcon(iconMap.SendHorizontal);
export const Settings = createStreamlineIcon(iconMap.Settings);
export const Settings2 = createStreamlineIcon(iconMap.Settings2);
export const Share2 = createStreamlineIcon(iconMap.Share2);
export const Shield = createStreamlineIcon(iconMap.Shield);
export const ShieldCheck = createStreamlineIcon(iconMap.ShieldCheck);
export const ShoppingBag = createStreamlineIcon(iconMap.ShoppingBag);
export const ShoppingCart = createStreamlineIcon(iconMap.ShoppingCart);
export const Sparkles = createStreamlineIcon(iconMap.Sparkles);
export const Square = createStreamlineIcon(iconMap.Square);
export const SquareStack = createStreamlineIcon(iconMap.SquareStack);
export const Sun = createStreamlineIcon(iconMap.Sun);
export const Tag = createStreamlineIcon(iconMap.Tag);
export const Tags = createStreamlineIcon(iconMap.Tags);
export const Ticket = createStreamlineIcon(iconMap.Ticket);
export const Trash2 = createStreamlineIcon(iconMap.Trash2);
export const TrendingUp = createStreamlineIcon(iconMap.TrendingUp);
export const TriangleAlert = createStreamlineIcon(iconMap.TriangleAlert);
export const Upload = createStreamlineIcon(iconMap.Upload);
export const User = createStreamlineIcon(iconMap.User);
export const Users = createStreamlineIcon(iconMap.Users);
export const Wallet = createStreamlineIcon(iconMap.Wallet);
export const Workflow = createStreamlineIcon(iconMap.Workflow);
export const Wrench = createStreamlineIcon(iconMap.Wrench);
export const X = createStreamlineIcon(iconMap.X);
export const XCircle = createStreamlineIcon(iconMap.XCircle);
export const XIcon = createStreamlineIcon(iconMap.XIcon);
export const Zap = createStreamlineIcon(iconMap.Zap);
