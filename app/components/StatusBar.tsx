export function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-2">
      <span className="text-[13px] font-semibold text-ink">9:41</span>
      <div className="flex items-center gap-1.5">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="none" aria-hidden>
      <rect x="0" y="7" width="3" height="4" rx="0.6" fill="currentColor" className="text-ink" />
      <rect x="4.5" y="5" width="3" height="6" rx="0.6" fill="currentColor" className="text-ink" />
      <rect x="9" y="3" width="3" height="8" rx="0.6" fill="currentColor" className="text-ink" />
      <rect x="13.5" y="0" width="3" height="11" rx="0.6" fill="currentColor" className="text-ink" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden>
      <path
        d="M7.5 9.6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
        className="text-ink"
      />
      <path
        d="M4.4 6.6a4.4 4.4 0 0 1 6.2 0"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        className="text-ink"
      />
      <path
        d="M1.8 3.9a8 8 0 0 1 11.4 0"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        className="text-ink"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="20"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeOpacity="0.4"
        className="text-ink"
      />
      <rect x="2" y="2" width="16" height="8" rx="1.5" fill="currentColor" className="text-ink" />
      <rect x="21.5" y="4" width="1.8" height="4" rx="0.9" fill="currentColor" className="text-ink" opacity="0.4" />
    </svg>
  );
}
