"use client";

import { useMemo, useState } from "react";

type Video = {
  id: number;
  title: string;
  channel: string;
  views: string;
  age: string;
  duration: string;
  category: string;
  color: string;
  emoji: string;
};

const videos: Video[] = [
  { id: 1, title: "Je crée un jeu Roblox en 24 heures…", channel: "Ruben Dev", views: "1,2 M", age: "il y a 2 jours", duration: "12:48", category: "Gaming", color: "#283b74", emoji: "🎮" },
  { id: 2, title: "Le meilleur setup pour coder en 2026", channel: "Tech Zone", views: "845 k", age: "il y a 5 jours", duration: "9:31", category: "Technologie", color: "#314c3f", emoji: "💻" },
  { id: 3, title: "J'ai testé les jeux Roblox les plus populaires", channel: "Pixel FR", views: "2,8 M", age: "il y a 1 semaine", duration: "18:22", category: "Gaming", color: "#63354e", emoji: "🕹️" },
  { id: 4, title: "Construire une IA qui reconnaît des images", channel: "CodeLab", views: "421 k", age: "il y a 3 jours", duration: "15:07", category: "Programmation", color: "#234c61", emoji: "🤖" },
  { id: 5, title: "24 heures dans une ville incroyable", channel: "Max Voyage", views: "3,1 M", age: "il y a 4 jours", duration: "21:04", category: "Voyage", color: "#69502d", emoji: "🌍" },
  { id: 6, title: "Cette astuce change complètement Minecraft", channel: "BlockMaster", views: "974 k", age: "il y a 6 jours", duration: "11:16", category: "Gaming", color: "#315b45", emoji: "⛏️" },
  { id: 7, title: "Comment fonctionne Internet ?", channel: "Science Facile", views: "612 k", age: "il y a 2 semaines", duration: "10:42", category: "Éducation", color: "#35416d", emoji: "🌐" },
  { id: 8, title: "Je transforme mon bureau avec 100 €", channel: "Setup Lab", views: "1,7 M", age: "il y a 8 jours", duration: "13:55", category: "Technologie", color: "#5b3942", emoji: "🖥️" },
  { id: 9, title: "Le défi impossible sur Geometry Dash", channel: "DashFR", views: "5,4 M", age: "il y a 1 mois", duration: "8:19", category: "Gaming", color: "#304e75", emoji: "⚡" },
  { id: 10, title: "Apprendre JavaScript rapidement", channel: "Dev Academy", views: "733 k", age: "il y a 3 semaines", duration: "17:12", category: "Programmation", color: "#6b5528", emoji: "JS" },
  { id: 11, title: "Les secrets des océans", channel: "Curieux", views: "2,2 M", age: "il y a 2 semaines", duration: "14:26", category: "Éducation", color: "#204f63", emoji: "🌊" },
  { id: 12, title: "Un voyage que je n'oublierai jamais", channel: "Alex Travel", views: "987 k", age: "il y a 4 jours", duration: "19:44", category: "Voyage", color: "#755033", emoji: "✈️" },
];

const categories = ["Tous", "Gaming", "Musique", "Programmation", "Technologie", "Éducation", "Voyage"];

function Thumbnail({ video }: { video: Video }) {
  return (
    <div className="yt-thumb" style={{ background: `linear-gradient(135deg, ${video.color}, #101114)` }}>
      <div className="yt-thumb-glow" />
      <span className="yt-thumb-emoji">{video.emoji}</span>
      <span className="yt-duration">{video.duration}</span>
    </div>
  );
}

export default function Page() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [sidebar, setSidebar] = useState(true);
  const [selected, setSelected] = useState<Video | null>(null);
  const [subscribed, setSubscribed] = useState<string[]>([]);
  const [liked, setLiked] = useState<number[]>([]);

  const filtered = useMemo(() => videos.filter((video) => {
    const matchesQuery = `${video.title} ${video.channel}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "Tous" || video.category === category;
    return matchesQuery && matchesCategory;
  }), [query, category]);

  const toggleSubscribe = (channel: string) => {
    setSubscribed((current) => current.includes(channel) ? current.filter((x) => x !== channel) : [...current, channel]);
  };

  return (
    <main className="yt-app">
      <header className="yt-header">
        <div className="yt-header-left">
          <button className="yt-icon-btn" onClick={() => setSidebar(!sidebar)} aria-label="Menu">☰</button>
          <button className="yt-logo" onClick={() => { setCategory("Tous"); setQuery(""); }}>
            <span className="yt-logo-mark">▶</span>
            <strong>UnoTube</strong>
          </button>
        </div>

        <div className="yt-search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher" />
          <button aria-label="Rechercher">⌕</button>
        </div>

        <div className="yt-header-right">
          <button className="yt-icon-btn" aria-label="Créer">＋</button>
          <button className="yt-icon-btn" aria-label="Notifications">🔔</button>
          <div className="yt-avatar">R</div>
        </div>
      </header>

      <div className="yt-layout">
        <aside className={`yt-sidebar ${sidebar ? "" : "collapsed"}`}>
          <button className="yt-side-item active" onClick={() => setCategory("Tous")}><span>⌂</span><b>Accueil</b></button>
          <button className="yt-side-item" onClick={() => setCategory("Tous")}><span>▣</span><b>Shorts</b></button>
          <button className="yt-side-item" onClick={() => setCategory("Tous")}><span>▤</span><b>Abonnements</b></button>
          <div className="yt-divider" />
          <div className="yt-side-title">Vous</div>
          <button className="yt-side-item"><span>◷</span><b>Historique</b></button>
          <button className="yt-side-item"><span>▱</span><b>Playlists</b></button>
          <button className="yt-side-item"><span>♡</span><b>Vidéos "J'aime"</b></button>
          <div className="yt-divider" />
          <div className="yt-side-title">Explorer</div>
          {["Tendances", "Musique", "Films et TV", "Direct"].map((item) => (
            <button key={item} className="yt-side-item"><span>•</span><b>{item}</b></button>
          ))}
        </aside>

        <section className={`yt-content ${sidebar ? "" : "wide"}`}>
          <div className="yt-chips">
            {categories.map((item) => (
              <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>

          <div className="yt-grid">
            {filtered.map((video) => (
              <article className="yt-card" key={video.id} onClick={() => setSelected(video)}>
                <Thumbnail video={video} />
                <div className="yt-card-info">
                  <div className="yt-channel-avatar">{video.channel.slice(0, 1)}</div>
                  <div className="yt-card-copy">
                    <h2>{video.title}</h2>
                    <p>{video.channel} ✓</p>
                    <p>{video.views} vues • {video.age}</p>
                  </div>
                  <button className="yt-more" onClick={(e) => e.stopPropagation()}>⋮</button>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="yt-empty">
              <div>⌕</div>
              <h2>Aucune vidéo trouvée</h2>
              <p>Essaie une autre recherche ou une autre catégorie.</p>
            </div>
          )}
        </section>
      </div>

      {selected && (
        <div className="yt-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="yt-watch" onClick={(e) => e.stopPropagation()}>
            <button className="yt-close" onClick={() => setSelected(null)}>×</button>
            <div className="yt-watch-video" style={{ background: `linear-gradient(135deg, ${selected.color}, #08090b)` }}>
              <span>{selected.emoji}</span>
              <button className="yt-play">▶</button>
              <small>{selected.duration}</small>
            </div>
            <div className="yt-watch-body">
              <h1>{selected.title}</h1>
              <div className="yt-watch-meta">
                <div className="yt-channel-avatar large">{selected.channel.slice(0, 1)}</div>
                <div><b>{selected.channel}</b><span>1,24 M abonnés</span></div>
                <button className={`yt-subscribe ${subscribed.includes(selected.channel) ? "subscribed" : ""}`} onClick={() => toggleSubscribe(selected.channel)}>
                  {subscribed.includes(selected.channel) ? "Abonné" : "S'abonner"}
                </button>
              </div>
              <div className="yt-actions">
                <button onClick={() => setLiked((x) => x.includes(selected.id) ? x.filter((id) => id !== selected.id) : [...x, selected.id])}>
                  {liked.includes(selected.id) ? "👍 Aimé" : "👍 J'aime"}
                </button>
                <button>↗ Partager</button>
                <button>⋯ Plus</button>
              </div>
              <div className="yt-description">
                <b>{selected.views} vues • {selected.age}</b>
                <p>Bienvenue sur UnoTube ! Cette vidéo est une démonstration de l'interface. Les vidéos affichées ici sont des contenus de démonstration.</p>
              </div>
              <div className="yt-comments"><b>Commentaires</b><span>💬 1,2 k</span></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
