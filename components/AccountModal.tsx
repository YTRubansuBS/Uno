"use client";

import { LogIn, LogOut, UserRound, X, Zap } from "lucide-react";

type AccountUser = { id: string; username: string; kind: "account" | "guest" } | null;

export default function AccountModal(props: {
  open: boolean;
  mode: "login" | "signup";
  setMode: (mode: "login" | "signup") => void;
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  busy: boolean;
  user: AccountUser;
  localUsername: string | null;
  onSubmit: () => void;
  onLocal: () => void;
  onLogout: () => void;
  onResetLocal: () => void;
  onClose: () => void;
}) {
  if (!props.open) return null;

  const online = props.user?.kind === "account";

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) props.onClose(); }}>
    <div className="modal-card">
      <button className="modal-close" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button>
      <div className="modal-brand">
        <span className="brand-mark small">U</span>
        <div><b>{online ? "Mon compte" : "Compte UNO"}</b><small>Comptes enregistrés avec Redis</small></div>
      </div>

      {!online && <>
        <div className="auth-tabs">
          <button className={props.mode === "login" ? "active" : ""} onClick={() => props.setMode("login")}>Connexion</button>
          <button className={props.mode === "signup" ? "active" : ""} onClick={() => props.setMode("signup")}>Créer</button>
        </div>
        <label className="modal-field"><span>Pseudo</span><input value={props.username} onChange={(event) => props.setUsername(event.target.value)} maxLength={20} placeholder="Ton pseudo" /></label>
        <label className="modal-field"><span>Mot de passe</span><input type="password" value={props.password} onChange={(event) => props.setPassword(event.target.value)} minLength={6} placeholder="6 caractères minimum" /></label>
        <button className="primary-btn full" onClick={props.onSubmit} disabled={props.busy || !props.username.trim() || props.password.length < 6}><LogIn size={18} /> {props.busy ? "..." : props.mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
        <button className="local-btn" onClick={props.onLocal}><Zap size={17} /> Jouer en local</button>
        {props.user?.kind === "guest" && <div className="modal-warning">Tu joues actuellement en invité. Crée un compte pour garder ton pseudo.</div>}
      </>}

      {online && <div className="account-connected">
        <div className="connected-avatar">{props.user.username.slice(0, 1).toUpperCase()}</div>
        <b>@{props.user.username}</b>
        <small>Compte en ligne</small>
        <button className="danger-btn full" onClick={props.onLogout}><LogOut size={17} /> Se déconnecter</button>
      </div>}

      {!online && props.localUsername && <button className="ghost-btn full" onClick={props.onResetLocal}><UserRound size={17} /> Réinitialiser le compte local</button>}
    </div>
  </div>;
}
