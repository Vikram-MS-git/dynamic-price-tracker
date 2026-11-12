import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);
// Price-alert targets are stored per user so accounts on one browser stay separate.
const alertsKey = (userId) => `dpt.alerts.v1.${userId}`;

function readAlerts(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(alertsKey(userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

// Mounted with key={userId} (see main.jsx) so state resets on login/logout.
export function AppProvider({ children, userId }) {
  const [trackOpen, setTrackOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [alerts, setAlerts] = useState(() => readAlerts(userId));

  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(alertsKey(userId), JSON.stringify(alerts));
    } catch {
      /* storage unavailable: alerts stay in memory for this session */
    }
  }, [alerts, userId]);

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
