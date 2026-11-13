import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const AppContext = createContext(null);

export function AppProvider({ children, userId }) {
  const [trackOpen, setTrackOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [alerts, setAlerts] = useState({});
  const [alertsLoading, setAlertsLoading] = useState(true);

  const refreshData = useCallback(() => setDataVersion((v) => v + 1), []);

  const loadAlerts = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await api.getAlerts();
      const map = {};
      list.forEach((item) => {
        map[item.product_id] = {
          id: item.id,
          target: Number(item.target_price),
          isTriggered: Boolean(item.is_triggered),
          triggeredAt: item.triggered_at,
          createdAt: item.created_at,
          latestPrice: item.latest_price != null ? Number(item.latest_price) : null,
          isSimulated: Boolean(item.latest_is_simulated),
        };
      });
      setAlerts(map);
    } catch {
      // Fallback: keep existing alerts in memory
    } finally {
      setAlertsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts, dataVersion]);

  const notifyProductAdded = useCallback(() => {
    setDataVersion((v) => v + 1);
    // Poll twice: at 2.5s and 6s to quickly catch scrape or demo fallback
    setTimeout(() => setDataVersion((v) => v + 1), 2500);
    setTimeout(() => setDataVersion((v) => v + 1), 6000);
  }, []);

  const setAlert = useCallback(async (productId, target) => {
    const numTarget = Number(target);
    setAlerts((a) => ({
      ...a,
      [productId]: { target: numTarget, isTriggered: false, createdAt: new Date().toISOString() },
    }));
    try {
      await api.setAlert(productId, numTarget);
      refreshData();
    } catch (err) {
      console.error('Failed to persist alert:', err);
    }
  }, [refreshData]);

  const removeAlert = useCallback(async (productId) => {
    setAlerts((a) => {
      const next = { ...a };
      delete next[productId];
      return next;
    });
    try {
      await api.removeAlert(productId);
      refreshData();
    } catch (err) {
      console.error('Failed to remove alert:', err);
    }
  }, [refreshData]);

  const value = useMemo(
    () => ({
      trackOpen,
      openTrack: () => setTrackOpen(true),
      closeTrack: () => setTrackOpen(false),
      dataVersion,
      refreshData,
      notifyProductAdded,
      alerts,
      alertsLoading,
      setAlert,
      removeAlert,
    }),
    [trackOpen, dataVersion, refreshData, notifyProductAdded, alerts, alertsLoading, setAlert, removeAlert]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
