import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getSession } from "../../services/session";
import Aparencia from "./Aparencia";
import "../Dashboard/index.css";
import "./index.css";

export default function Configuracoes() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/login", { replace: true }); return; }
    getSession(token).then(user => {
      if (!active) return;
      if (user.papel === "admin") { navigate("/admin", { replace: true }); return; }
      setProfile(user);
    }).catch(err => {
      if (!active) return;
      if ([401, 422].includes(err.status)) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
      } else setError(err.message);
    });
    return () => { active = false; };
  }, [navigate, attempt]);

  if (!profile) return <main className="dash-page dash-status"><p role={error ? "alert" : "status"}>{error || "Carregando suas configurações…"}</p>{error && <button className="settings-button" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Tentar novamente</button>}</main>;

  return <Aparencia profile={profile} />;
}
