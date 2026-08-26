import { createContext, useContext, useState, type ReactNode } from "react";
import type { Store } from "../types";
import { INITIAL_STORE } from "../data/onFile";

type StoreContextValue = {
  store: Store;
  patch: (partial: Partial<Store> | ((prev: Store) => Partial<Store>)) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(INITIAL_STORE);

  function patch(partial: Partial<Store> | ((prev: Store) => Partial<Store>)) {
    setStore((prev) => ({ ...prev, ...(typeof partial === "function" ? partial(prev) : partial) }));
  }

  return <StoreContext.Provider value={{ store, patch }}>{children}</StoreContext.Provider>;
}

// The one hook every screen uses to read/write the Visit Summary store.
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
