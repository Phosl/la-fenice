import { PhoenixMark } from "./phoenix-mark";

type LogoLockupProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function LogoLockup({ compact = false, inverse = false }: LogoLockupProps) {
  return (
    <span className={`logo-lockup ${compact ? "logo-lockup--compact" : ""} ${inverse ? "logo-lockup--inverse" : ""}`}>
      <PhoenixMark className="logo-lockup__mark" />
      <span className="logo-lockup__words">
        <span className="logo-lockup__name">La Fenice</span>
        <span className="logo-lockup__place">Positano</span>
      </span>
    </span>
  );
}
