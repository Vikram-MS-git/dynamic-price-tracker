import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);
const ALERTS_KEY = 'dpt.alerts.v1';

function readAlerts() {
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function AppProvider({ children }) {
  const [trackOpen, setTrackOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [alerts, setAlerts] = useState(readAlerts);

  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    } catch {
      /* storage unavailable: alerts stay in memory for this session */
    }
  }, [alerts]);

  const refreshData = useCallback(() => setDataVersion((v) => v + 1), []);

  // The backend scrapes a new product in the background, so reload once now
  // and once more shortly after to pick up the first price.
  const notifyProductAdded = useCallback(() => {
    setDataVersion((v) => v + 1);
    setTimeout(() => setDataVersion((v) => v + 1), 8000);
  }, []);

  const setAlert = useCallback((productId, target) => {
    setAlerts((a) => ({ ...a, [productId]: { target: Number(target), createdAt: new Date().toISOString() } }));
  }, []);

  const removeAlert = useCallback((productId) => {
    setAlerts((a) => {
      const next = { ...a };
      delete next[productId];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      trackOpen,
      openTrack: () => setTrackOpen(true),
      closeTrack: () => setTrackOpen(false),
      dataVersion,
      refreshData,
      notifyProductAdded,
      alerts,
      setAlert,
      removeAlert,
    }),
    [trackOpen, dataVersion, refreshData, notifyProductAdded, alerts, setAlert, removeAlert]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
