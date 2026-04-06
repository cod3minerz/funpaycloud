import Image from "next/image";
import logoCloud from "../../assets/logoCloud.svg";
import logoSmall from "../../assets/logoSmall.svg";

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
        src={logoSmall}
        alt="FunPay Cloud"
        width={logoSmall.width}
        height={logoSmall.height}
        className={`h-[22px] max-w-[32px] w-auto object-contain ${className}`.trim()}
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
