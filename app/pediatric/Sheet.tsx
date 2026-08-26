import { useEffect, useRef } from "react";

// Two persistent zones, per the Flow B redesign brief: a scrolling history
// pane holding everything that's already been said or already happened,
// and a contextual sheet docked to the bottom holding only the one thing
// still open right now. Purely presentational — no business logic lives
// here; callers own all state and pass in the JSX for each zone.
export function ConversationShell({
  history,
  historyKey,
  sheet,
  sheetCollapsed,
  onToggleCollapse,
}: {
  history: React.ReactNode;
  // Changes whenever new content is appended to `history` — the only signal
  // this component needs to know it should scroll to the bottom again.
  historyKey: string | number;
  sheet: React.ReactNode;
  sheetCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = historyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [historyKey]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "#f4f7fa" }}>
      <div ref={historyRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
        {history}
      </div>

      <div style={{ flexShrink: 0, background: "#ffffff", borderRadius: "22px 22px 0 0", borderTop: "1px solid #eef2f6", boxShadow: "0 -4px 16px rgba(13,20,33,0.05)" }}>
        <div className="tap-target" onClick={onToggleCollapse} style={{ cursor: "pointer", display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#dbe6ee" }} />
        </div>
        <div style={{ maxHeight: sheetCollapsed ? 0 : "50vh", overflowY: sheetCollapsed ? "hidden" : "auto", transition: "max-height 220ms ease-out", padding: sheetCollapsed ? "0 20px" : "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {sheet}
        </div>
      </div>
    </div>
  );
}
