import { useState, useEffect } from 'react';
import parseCSV from '../utils/csvParser';

// Data fetching hook for Google Sheets
export const useSheetData = (url, gameType) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(url)
      .then(res => res.text())
      .then(csv => {
        const parsed = parseCSV(csv);
        const filtered = gameType
          ? parsed.filter(row => row.game_type === gameType)
          : parsed;
        setData(filtered);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [url, gameType]);

  return { data, loading, error };
};

export default useSheetData;
