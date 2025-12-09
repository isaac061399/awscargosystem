'use client';

import { useEffect } from 'react';

export default function TimezoneCookie() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (!tz) return;

      const has = document.cookie.match(/(?:^|; )tz=([^;]+)/)?.[1];

      if (has !== tz) {
        document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
      }
    } catch {}
  }, []);

  return null;
}
