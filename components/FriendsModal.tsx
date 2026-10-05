"use client";

import { Check, Plus, RefreshCw, Send, Users, X } from "lucide-react";

export type FriendItem = { id: string; username: string; display_name: string | null; friendshipId: string; incoming?: boolean; status: "pending" | "accepted" | "blocked" };
export type FriendSearchItem = { id: string; username: string; display_name: string | null };

export default function FriendsModal(props: { open: boolean; search: string; setSearch: (value: string) => void; results: FriendSearchItem[]; friends: FriendItem[]; busy: boolean; onSearch: () => void; onAdd: (item: FriendSearchItem) => void; onAccept: (id: string) => void; onRemove: (id: string) => void; onClose: () => void }) {
  if (!props.open) return null;
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) props.onClose(); }}>
    <div className="modal-card friends-modal">
      <button className="modal-close" onClick={props.onClose} aria-label="Fermer"><X size={18}/></button>
      <div className="modal-brand"><Users size={21}/><div><b>Mes amis</b><small>Ajoute des joueurs par pseudo</small></div></div>
      <div className="friend-search"><input value={props.search} onChange={(e) => props.setSearch(e.target.value)} placeholder="Rechercher un pseudo"/><button onClick={props.onSearch} disabled={props.busy}>{props.busy ? <RefreshCw size={16} className="spin"/> : <Send size={16}/>}</button></div>
      {props.results.length > 0 && <div className="friend-search-results">{props.results.map((item) => <div className="friend-row" key={item.id}><div><b>@{item.username}</b><small>{item.display_name || "Joueur UNO"}</small></div><button className="small-action" onClick={() => props.onAdd(item)}><Plus size={15}/> Ajouter</button></div>)}</div>}
      <div className="section-title">Relations</div>
      <div className="friend-list">{props.friends.length === 0 ? <div className="empty-state">Aucun ami ou demande.</div> : props.friends.map((friend) => <div className="friend-row" key={friend.friendshipId}>
        <div className="friend-person"><span className="slot-avatar">{friend.username.slice(0,1).toUpperCase()}</span><div><b>@{friend.username}</b><small>{friend.status === "accepted" ? "Ami" : friend.incoming ? "Demande reçue" : "Demande envoyée"}</small></div></div>
        {friend.status === "pending" && friend.incoming ? <button className="small-action" onClick={() => props.onAccept(friend.friendshipId)}><Check size={15}/> Accepter</button> : friend.status === "accepted" ? <button className="icon-action" onClick={() => props.onRemove(friend.friendshipId)} title="Supprimer"><X size={15}/></button> : <span className="pending-dot"/>}
      </div>)}</div>
    </div>
  </div>;
}