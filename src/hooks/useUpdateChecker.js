import { useState, useEffect } from 'react';

// Hardcoded current version. When you build a new release, bump this!
// We've set it to 1.0.0 so that our 1.1.0 version.json triggers the banner for testing.
const CURRENT_VERSION = '1.0.0'; 

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(null);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        // Cache bust the version.json request so we always get the latest
        const res = await fetch(`/version.json?t=${new Date().getTime()}`);
        if (!res.ok) return;
        const data = await res.json();
        
        // Simple string comparison for versions (assuming semantic versioning x.y.z)
        if (data.version && data.version !== CURRENT_VERSION) {
          const isNewer = data.version.localeCompare(CURRENT_VERSION, undefined, { numeric: true, sensitivity: 'base' }) > 0;
          if (isNewer) {
            setUpdateAvailable(data);
          }
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    };

    // Delay the check slightly so it doesn't block initial render
    const timer = setTimeout(() => {
      checkUpdate();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return { updateAvailable, setUpdateAvailable };
}
