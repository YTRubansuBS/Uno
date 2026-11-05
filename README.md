# UNO Online

Jeu UNO web simple et rapide :

- Solo contre 1 à 3 IA avec Facile, Normal ou Difficile.
- Multijoueur privé jusqu'à 4 joueurs avec un code à 6 caractères.
- Compte en ligne avec pseudo + mot de passe.
- Compte local sans inscription.
- Toutes les données du multijoueur et des comptes passent par Redis côté serveur.
- Le navigateur ne parle jamais directement à Redis : les routes Next.js sécurisent les actions.

## Lancer en local

```bash
npm install
npm run dev
```

Crée un fichier `.env.local` avec :

```env
STORAGE_REDIS_URL=redis://...
# ou REDIS_URL=redis://...
```

## Vercel + Redis

Dans Vercel, connecte le projet à **Upstash Redis** depuis le Marketplace. L'intégration crée les variables Redis pour le projet. Après l'ajout ou la modification des variables, redéploie le projet.

Le jeu utilise une URL Redis classique côté serveur :

- `STORAGE_REDIS_URL` (prioritaire)
- `REDIS_URL` (fallback)

Après toute modification des variables sur Vercel, redéploie le projet.

## Multijoueur

Le serveur garde le salon, les joueurs, les mains et l'état de la partie dans Redis. Les navigateurs interrogent simplement le salon régulièrement pour voir les nouveaux coups. Une serrure Redis empêche deux actions de modifier le même salon au même moment.

## Vérification

GitHub Actions lance `npm run lint` puis `npm run build` à chaque push sur `main` et sur les pull requests.
