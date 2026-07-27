import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  compact?: boolean;
}

export function Logo({ compact = false }: LogoProps) {
  if (compact) {
    return (
      <Link href="/" className="header-logo" aria-label="Anchor Capital Home">
        <div className="header-logo-icon">
          <Image src="/logo.svg" alt="Anchor Capital Logo" width={32} height={32} />
        </div>
      </Link>
    );
  }

  return (
    <Link href="/" className="header-logo">
      <div className="header-logo-icon">
        <Image src="/logo.svg" alt="Anchor Capital Logo" width={32} height={32} />
      </div>
      <div className="header-logo-text">
        <div className="header-logo-name" style={{ fontWeight: 700, letterSpacing: '0.06em', fontSize: '0.95rem', textTransform: 'uppercase' }}>
          ANCHOR CAPITAL
        </div>
        <div className="header-logo-tagline" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
          Empowering communities to invest in the businesses they live with every day
        </div>
      </div>
    </Link>
  );
}
