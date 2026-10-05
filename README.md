# UNO Online

Jeu UNO web avec trois modes :

- Solo contre 1 à 3 IA avec niveaux Facile, Normal et Difficile.
- Multijoueur privé jusqu'à 4 joueurs avec salon et code à 6 caractères.
- Compte Supabase ou compte local sur l'appareil.

## Installation

```bash
npm install
npm run dev
```

## Supabase

Copie `.env.example` en `.env.local` et renseigne `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou les alias `NEXT_PUBLIC_URL` et `NEXT_PUBLIC_KEY`).

Puis exécute `supabase/schema.sql` dans le SQL Editor de ton projet Supabase.

Active l'authentification Email/Password dans Supabase Auth.

Important : seule la clé publishable/anon doit être envoyée au navigateur. Ne mets jamais `service_role` dans les variables `NEXT_PUBLIC_*`.

## Multijoueur

Le créateur du salon est l'hôte et synchronise l'état de la partie. Les actions des joueurs passent par `room_actions`, puis l'hôte valide et applique les règles UNO. Les mains des joueurs sont stockées séparément et ne sont lisibles que par le joueur concerné ou l'hôte via RLS.

Le bouton de partage copie soit le code, soit un lien `?room=XXXXXX` qui ouvre directement l'écran Rejoindre.

## Vérification

Le workflow GitHub Actions `Verify` lance automatiquement `npm run lint` puis `npm run build` à chaque push sur `main` et sur les pull requests.
