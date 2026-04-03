import Image from "next/image";
import logoCloud from "../../assets/logoCloud.svg";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className = "", compact = false }: BrandLogoProps) {
  const sizeClass = compact ? "h-7 md:h-8 max-w-[190px]" : "h-9 md:h-10 max-w-[230px]";

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
