import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
};

export function BrandLogo({ className = "", compact = false, iconOnly = false }: BrandLogoProps) {
  const sizeClass = compact ? "h-[27px] max-w-[172px]" : "h-[30px] max-w-[190px]";

  if (iconOnly) {
    return (
      <Image
        src="/branding/logo_short_new.svg"
        alt="FunPay Cloud"
        width={245}
        height={167}
        className={`h-[22px] max-w-[32px] w-auto object-contain ${className}`.trim()}
        priority
      />
    );
  }

  return (
    <Image
      src="/branding/logo_full_new.svg"
      alt="FunPay Cloud"
      width={1223}
      height={206}
      className={`${sizeClass} w-auto object-contain ${className}`.trim()}
      priority
    />
  );
}
