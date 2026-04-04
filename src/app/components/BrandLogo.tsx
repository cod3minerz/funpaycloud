import Image from "next/image";
import logoCloud from "../../assets/logoCloud.svg";
import logoSmall from "../../assets/logoSmall.svg";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
};

export function BrandLogo({ className = "", compact = false, iconOnly = false }: BrandLogoProps) {
  const sizeClass = compact ? "h-7 md:h-8 max-w-[190px]" : "h-9 md:h-10 max-w-[230px]";

  if (iconOnly) {
    return (
      <Image
        src={logoSmall}
        alt="FunPay Cloud"
        width={logoSmall.width}
        height={logoSmall.height}
        className={`h-8 w-auto object-contain ${className}`.trim()}
        priority
      />
    );
  }

  return (
    <Image
      src={logoCloud}
      alt="FunPay Cloud"
      width={logoCloud.width}
      height={logoCloud.height}
      className={`${sizeClass} w-auto object-contain ${className}`.trim()}
      priority
    />
  );
}
