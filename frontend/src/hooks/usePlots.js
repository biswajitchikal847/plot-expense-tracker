import { useEffect, useState, useCallback } from 'react';
import { listPlots } from '../services/api';

export const usePlots = () => {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlots();
      setPlots(data);
    } catch (e) {
      setError(e?.message || 'Failed to load plots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { plots, loading, error, refresh };
};
