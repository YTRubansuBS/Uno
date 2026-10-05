"use client";

import { LogIn, LogOut, ShieldCheck, UserRound, X, Zap } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function AccountModal(props: { open: boolean; mode: "login" | "signup"; setMode: (mode: "login" | "signup") => void; email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void; username: string; setUsername: (value: string) => void; busy: boolean; canOnline: boolean; user: User | null; localUsername: string | null; onSubmit: () => void; onLocal: () => void; onLogout: () => void; onResetLocal: () => void; onClose: () => void }) {
  if (!props.open) return null;
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) props.onClose(); }}>
    <div className="modal-card">
      <button className="modal-close" onClick={props.onClose} aria-label="Fermer"><X size={18}/></button>
      <div className="modal-brand"><span className="brand-mark small">U</span><div><b>Compte UNO</b><small>Supabase + mode local</small></div></div>
      <div className="auth-tabs"><button className={props.mode === "login" ? "active" : ""} onClick={() => props.setMode("login")}>Connexion</button><button className={props.mode === "signup" ? "active" : ""} onClick={() => props.setMode("signup")}>Créer un compte</button></div>
      {props.mode === "signup" && <label className="modal-field"><span>Pseudo</span><input value={props.username} onChange={(e) => props.setUsername(e.target.value)} maxLength={20} placeholder="Ton pseudo"/></label>}
      <label className="modal-field"><span>E-mail</span><input type="email" value={props.email} onChange={(e) => props.setEmail(e.target.value)} placeholder="toi@email.com"/></label>
      <label className="modal-field"><span>Mot de passe</span><input type="password" value={props.password} onChange={(e) => props.setPassword(e.target.value)} minLength={6} placeholder="6 caractères minimum"/></label>
      <button className="primary-btn full" onClick={props.onSubmit} disabled={props.busy || !props.canOnline}><LogIn size={18}/> {props.busy ? "Chargement..." : props.mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
      <button className="local-btn" onClick={props.onLocal}><Zap size={17}/> Continuer en compte local</button>
      {props.user && <button className="danger-btn full" onClick={props.onLogout}><LogOut size={17}/> Se déconnecter de Supabase</button>}
      {!props.user && props.localUsername && <button className="ghost-btn full" onClick={props.onResetLocal}><UserRound size={17}/> Réinitialiser le compte local</button>}
      {!props.canOnline && <div className="modal-warning"><ShieldCheck size={16}/> Ajoute les variables Supabase pour activer les comptes en ligne.</div>}
    </div>
  </div>;
}