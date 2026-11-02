import { useEffect, useState } from "react";
import { hasActivePremium, premiumExpiration } from "../services/assinatura";

export default function usePremiumStatus(profile) {
  const [now, setNow] = useState(() => Date.now());
  const expiration = premiumExpiration(profile);
  const expiresAt = expiration?.getTime();

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    const timeout = expiresAt > now
      ? window.setTimeout(refresh, Math.min(Math.max(0, expiresAt - Date.now() + 10), 2147483647))
      : null;
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [expiresAt, now]);

  return { premium: hasActivePremium(profile, now), expiration };
}
