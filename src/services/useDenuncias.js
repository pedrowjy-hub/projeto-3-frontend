import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { listarDenuncias } from "./denuncias";

export default function useDenuncias(admin, enabled = true) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    listarDenuncias(admin, controller.signal).then(data => {
      if (!controller.signal.aborted) setRecords(data);
    }).catch(err => {
      if (controller.signal.aborted) return;
      if (err.status === 401 || err.status === 422) navigate("/login", { replace: true });
      setError(err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [admin, enabled, version, navigate]);
  function reload() { setLoading(true); setError(""); setVersion(value => value + 1); }
  return { records, loading, error, reload };
}
