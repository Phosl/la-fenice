import Image from "next/image";
import { brandLogo } from "@/lib/brand-assets";

type LogoLockupProps = {
  adaptive?: boolean;
  compact?: boolean;
  inverse?: boolean;
  priority?: boolean;
};

export function LogoLockup({
  adaptive = false,
  compact = false,
  inverse = false,
  priority = false,
}: LogoLockupProps) {
  const className = [
    "logo-lockup",
    compact && "logo-lockup--compact",
    inverse && "logo-lockup--inverse",
    adaptive && "logo-lockup--adaptive",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span aria-label="La Fenice Positano" className={className} role="img">
      <Image
        alt=""
        aria-hidden="true"
        className="logo-lockup__asset logo-lockup__asset--blue"
        height={brandLogo.height}
        priority={priority}
        sizes={compact ? "120px" : "240px"}
        src={inverse ? brandLogo.whiteSrc : brandLogo.blueSrc}
        unoptimized
        width={brandLogo.width}
      />
      {adaptive ? (
        <Image
          alt=""
          aria-hidden="true"
          className="logo-lockup__asset logo-lockup__asset--white"
          height={brandLogo.height}
          priority={priority || adaptive}
          sizes="120px"
          src={brandLogo.whiteSrc}
          unoptimized
          width={brandLogo.width}
        />
      ) : null}
    </span>
  );
}
