import { useEffect, useState, useCallback } from 'react';
import { listTransactions } from '../services/api';

export const useTransactions = (plotId) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTransactions(plotId);
      setTransactions(data);
    } catch (e) {
      setError(e?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { transactions, loading, error, refresh };
};
