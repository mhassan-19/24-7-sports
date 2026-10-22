import logoMark from '@sports247/tokens/assets/logo-mark.svg?raw';
import logoPrimary from '@sports247/tokens/assets/logo-primary.svg?raw';
import s from './ui.module.css';

/**
 * The 24/7 Sports logo. Numerals take the text colour (Midnight on light, Bone on dark) and the
 * slash stays Pulse Orange: exactly the approved `signature` / `signature-reversed` versions.
 * Primary needs ≥ 120 px width; below that use the logomark (≥ 48 px).
 */
export function Logo({ layout, width, className }: { layout: 'primary' | 'mark'; width: number; className?: string }) {
  return (
    <span
      className={`${s.logo} ${className ?? ''}`}
      style={{ inlineSize: width }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: layout === 'primary' ? logoPrimary : logoMark }}
    />
  );
}

/** The signature slash device: 60°, leaning forward, never mirrored. */
export function Slash({ height = 18, width = 3, color }: { height?: number; width?: number; color?: string }) {
  return <span className={s.slash} aria-hidden="true" style={{ blockSize: height, inlineSize: width, background: color }} />;
}

export function Stripes() {
  return <div className={s.stripes} aria-hidden="true" />;
}
