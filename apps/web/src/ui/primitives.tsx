import { crestInitials } from '@sports247/domain';
import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { Slash } from './brand';
import { Icon } from './Icon';
import s from './ui.module.css';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Section({
  title,
  action,
  children,
  as: Tag = 'section',
  headingLevel = 2,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  as?: 'section' | 'div' | 'aside';
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <Tag className={s.section}>
      {title && (
        <header className={s.sectionHead}>
          <Slash />
          <H className={cx(s.h2, 'u')}>{title}</H>
          {action}
        </header>
      )}
      {children}
    </Tag>
  );
}

export function SeeAll({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className={s.link} to={to}>
      {children}
    </Link>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark';

export function Button({
  variant = 'primary',
  to,
  children,
  ...rest
}: { variant?: ButtonVariant; to?: string; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cx(s.btn, s[variant], rest.className);
  if (to) {
    return (
      <Link className={cls} to={to}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" {...rest} className={cls}>
      {children}
    </button>
  );
}

/** Local segmented control (day tabs, leader kinds). */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className={s.segmented} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** URL-driven tabs for entity pages (shareable, back-button friendly). */
export function TabsNav({ items, label }: { items: { to: string; label: ReactNode; end?: boolean }[]; label: string }) {
  return (
    <nav className={s.tabs} aria-label={label}>
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end ?? true} replace preventScrollReset>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Chip({ pressed, onClick, children }: { pressed?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" className={s.chip} aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}

export function ChipLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className={s.chip} to={to}>
      {children}
    </Link>
  );
}

export const Chips = ({ children, label }: { children: ReactNode; label?: string }) => (
  <div className={s.chips} role={label ? 'group' : undefined} aria-label={label}>
    {children}
  </div>
);

/** A logo inside a neutral chip; initials when there is no image or it fails to load. */
export function Crest({ name, shortName, logo, size = 28 }: { name: string; shortName?: string | null; logo?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={s.crest} style={{ '--size': `${size}px` } as React.CSSProperties} aria-hidden="true">
      {logo && !failed ? (
        <img src={logo} alt="" loading="lazy" decoding="async" width={size} height={size} onError={() => setFailed(true)} />
      ) : (
        crestInitials(name, shortName)
      )}
    </span>
  );
}

export function Avatar({ name, image, size = 40 }: { name: string; image?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={s.avatar} style={{ '--size': `${size}px` } as React.CSSProperties} aria-hidden="true">
      {image && !failed ? (
        <img src={image} alt="" loading="lazy" decoding="async" width={size} height={size} onError={() => setFailed(true)} />
      ) : (
        name.trim().charAt(0)
      )}
    </span>
  );
}

export const Badge = ({ children, accent }: { children: ReactNode; accent?: boolean }) => (
  <span className={cx(s.badge, accent && s.badgeAccent)}>{children}</span>
);

export const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx(s.panel, className)}>{children}</div>
);

export const List = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx(s.list, className)}>{children}</div>
);

/** One row in a list: leading visual, main content, trailing value. A link when `to` is set. */
export function Row({ to, lead, children, trail }: { to?: string; lead?: ReactNode; children: ReactNode; trail?: ReactNode }) {
  const body = (
    <>
      <span>{lead}</span>
      <span style={{ minWidth: 0, display: 'grid' }}>{children}</span>
      <span>{trail}</span>
    </>
  );
  return to ? (
    <Link className={s.row} to={to}>
      {body}
    </Link>
  ) : (
    <div className={s.row}>{body}</div>
  );
}

export function Tiles({ items }: { items: { label: string; value: ReactNode; accent?: boolean }[] }) {
  return (
    <div className={s.tiles}>
      {items.map((i) => (
        <div className={s.tile} key={i.label}>
          <span className={s.tileValue} style={i.accent ? { color: 'var(--accent-text)' } : undefined}>
            {i.value}
          </span>
          <span className={s.tileLabel}>{i.label}</span>
        </div>
      ))}
    </div>
  );
}

export function KeyValues({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className={cx(s.kv, s.panel)}>
      {items.map((i) => (
        <div key={i.label}>
          <dt>{i.label}</dt>
          <dd>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Breadcrumbs({ items, label }: { items: { label: ReactNode; to?: string }[]; label: string }) {
  return (
    <nav className={s.crumbs} aria-label={label}>
      {items.map((i, idx) => (
        <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {idx > 0 && <Icon name="chevron" className={s.mirror} />}
          {i.to ? <Link to={i.to}>{i.label}</Link> : <span aria-current="page">{i.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export const Eyebrow = ({ children }: { children: ReactNode }) => <p className={s.eyebrow}>{children}</p>;
export const H1 = ({ children, upper }: { children: ReactNode; upper?: boolean }) => (
  <h1 className={cx(s.h1, upper && 'u')}>{children}</h1>
);
export const Display = ({ children }: { children: ReactNode }) => <p className={cx(s.display, 'u')}>{children}</p>;

export function Select({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label htmlFor={id} className="small muted" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      {label}
      <select id={id} className={s.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export { s as ui, cx };
