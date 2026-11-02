import { useState } from "react";

export default function FotoPerfil({ profile }) {
  const [failed, setFailed] = useState("");
  const src = profile.foto_perfil;
  return src && src !== failed
    ? <img className="profile-photo" src={src} alt="" onError={() => setFailed(src)} />
    : <>{(profile.nome || profile.username || "U").trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</>;
}
