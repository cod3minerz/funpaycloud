import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
};

export function BrandLogo({ className = "", compact = false, iconOnly = false }: BrandLogoProps) {
  if (iconOnly) {
    return (
      <Image
        src="/branding/logo_short_new.svg"
        alt="FunPay Cloud"
        width={32}
        height={22}
        unoptimized
        className={`block h-auto w-auto object-contain ${className}`.trim()}
        priority
      />
    );
  }

  return (
    <Image
      src="/branding/logo_full_new.svg"
      alt="FunPay Cloud"
      width={compact ? 168 : 190}
      height={compact ? 27 : 30}
      unoptimized
      className={`block h-auto w-auto object-contain ${className}`.trim()}
      priority
    />
  );
}
