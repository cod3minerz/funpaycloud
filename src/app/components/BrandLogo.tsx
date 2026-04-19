import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
  darkText?: boolean;
};

export function BrandLogo({ className = "", compact = false, iconOnly = false, darkText = false }: BrandLogoProps) {
  if (iconOnly) {
    return (
      <Image
        src="/branding/logo_short_new.svg"
        alt="FunPay Cloud"
        width={32}
        height={22}
        unoptimized
        className={`block h-[22px] w-auto max-w-none object-contain ${className}`.trim()}
        priority
      />
    );
  }

  return (
    <Image
      src={darkText ? "/branding/logo_full_new_dark.svg" : "/branding/logo_full_new.svg"}
      alt="FunPay Cloud"
      width={compact ? 168 : 190}
      height={compact ? 27 : 30}
      unoptimized
      className={`block ${compact ? 'h-[27px]' : 'h-[30px]'} w-auto max-w-none object-contain ${className}`.trim()}
      priority
    />
  );
}
