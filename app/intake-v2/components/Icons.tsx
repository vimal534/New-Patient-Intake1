// Inline SVG icon set for /intake-v2 — 1.7–2.4 stroke weight, round
// caps/joins, 24×24 viewBox, per the handoff README's "Assets" section.
// No image assets; brand marks (VISA/APPLE/MC/AMEX) are plain text, to be
// swapped for licensed marks later.

type IconProps = { size?: number; color?: string; className?: string };

export function ChevronLeftIcon({ size = 13, color = "#101828", className }: IconProps) {
  return (
    <svg width={size} height={size * (22 / 13)} viewBox="0 0 13 22" fill="none" className={className}>
      <path d="M11 2L2 11l9 9" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 26, color = "#1677E8" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-4z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ size = 15, color = "#067647", strokeWidth = 2.6 }: IconProps & { strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12.5l5 5L20 6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfoIcon({ size = 18, color = "#1677E8" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={1.8} />
      <path d="M12 11v6M12 7.6v.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function StethoscopeIcon({ size = 24, color = "#1677E8" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 3v6a5 5 0 0010 0V3" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 14v3a4 4 0 108 0v-1" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UserIcon({ size = 16, color = "#667085" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M4.5 20c0-3.6 3.4-5.6 7.5-5.6s7.5 2 7.5 5.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ size = 16, color = "#667085" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" stroke={color} strokeWidth={1.8} />
      <path d="M8 3.5v4M16 3.5v4M3.5 10.5h17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function LocationIcon({ size = 17, color = "#667085" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.6" stroke={color} strokeWidth={1.8} />
    </svg>
  );
}

export function ClockIcon({ size = 17, color = "#667085" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
      <path d="M12 7.5V12l3.2 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function CardIcon({ size = 19, color = "#B54708" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" stroke={color} strokeWidth={1.8} />
      <path d="M2.5 10h19" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function UploadIcon({ size = 19, color = "#667085" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4M7 9l5-5 5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3.5h16V16" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ScanCardIcon({ size = 28, color = "#1677E8" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="5" width="19" height="14" rx="3" stroke={color} strokeWidth={1.7} />
      <circle cx="9" cy="11" r="2.2" stroke={color} strokeWidth={1.7} />
      <path
        d="M6.5 16c.6-1.4 1.5-2.1 2.5-2.1s1.9.7 2.5 2.1M14.5 10h4M14.5 13.5h4"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShieldPlainIcon({ size = 26, color = "#1677E8" }: IconProps) {
  return <ShieldCheckIcon size={size} color={color} />;
}

export function LockIcon({ size = 12, color = "#667085" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke={color} strokeWidth={2} />
      <path d="M8 11V8a4 4 0 018 0v3" stroke={color} strokeWidth={2} />
    </svg>
  );
}

export function ShieldLockIcon({ size = 17, color = "#067647" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-4z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MailIcon({ size = 18, color = "#667085" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke={color} strokeWidth={1.8} />
      <path d="M3 7l9 6 9-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 16, color = "#98A2B3" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 5l7 7-7 7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 17, color = "#fff" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12h15M13 6l6 6-6 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Icon-only Edit/Remove row actions (HealthCategoryEditors.tsx) —
// replaces the earlier text links so every row's action cluster is the
// same fixed width regardless of label length ("Edit"/"Remove" vs. just
// "Remove") and reads at a glance without two adjacent blue text links.
export function PencilIcon({ size = 17, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20l.9-3.9L15.6 4.4a1.5 1.5 0 012.1 0l1.9 1.9a1.5 1.5 0 010 2.1L8.9 19.1 4 20z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 6.5l3.5 3.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon({ size = 17, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4.5 7h15" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <path d="M9 7V4.8a1 1 0 011-1h4a1 1 0 011 1V7" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 7l.9 12.1a1.5 1.5 0 001.5 1.4h6.2a1.5 1.5 0 001.5-1.4L17.5 7" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.2 11v6M13.8 11v6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  );
}
