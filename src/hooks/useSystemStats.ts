import { useState, useEffect } from "react";
import { getSystemStats } from "../lib/tauri";
import type { SystemStats } from "../types";

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    ram_used: 0,
    ram_total: 1,
    battery: null,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSystemStats();
        setStats(data);
      } catch {}
    };

    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}
