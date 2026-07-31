import Image from "next/image";

type LogoLockupProps = {
  adaptive?: boolean;
  compact?: boolean;
  inverse?: boolean;
};

const BLUE_LOGO = "/logo-la-fenice.svg";
const WHITE_LOGO = "/logo-la-fenice_white.svg";

export function LogoLockup({
  adaptive = false,
  compact = false,
  inverse = false,
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
        height={972}
        sizes={compact ? "120px" : "240px"}
        src={inverse ? WHITE_LOGO : BLUE_LOGO}
        unoptimized
        width={1618}
      />
      {adaptive ? (
        <Image
          alt=""
          aria-hidden="true"
          className="logo-lockup__asset logo-lockup__asset--white"
          height={972}
          sizes="120px"
          src={WHITE_LOGO}
          unoptimized
          width={1618}
        />
      ) : null}
    </span>
  );
}
