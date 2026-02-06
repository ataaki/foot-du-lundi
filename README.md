# SDLV Booker

Bot de reservation automatique pour les terrains de football a **Sport dans la Ville** via l'API [DoInSport](https://doinsport.club).

## Fonctionnalites

- **Reservation automatique J-45** : configure des regles (jour + heure + duree) et le bot reserve automatiquement des que le creneau ouvre, 45 jours a l'avance
- **Preferences de terrains** : choisis l'ordre de priorite des terrains, le bot prend le meilleur disponible
- **Reservation manuelle** : parcours les creneaux disponibles et reserve en un clic
- **Paiement automatique** : pipeline complet booking → panier → paiement → confirmation Stripe.js (gere le 3DS)
- **Dashboard web** : interface pour gerer les regles, voir les reservations et l'historique

## Stack

- **Backend** : Node.js, Express 5, better-sqlite3, node-cron
- **Frontend** : HTML/CSS/JS vanilla
- **Paiement** : Playwright (headless Chromium) pour la confirmation Stripe.js
- **Base de donnees** : SQLite (fichier local `data/bookings.db`)

## Installation

```bash
git clone https://github.com/<user>/sdlv-booker.git
cd sdlv-booker
npm install
npx playwright install chromium
```

Copie le fichier d'environnement et remplis tes identifiants :

```bash
cp .env.example .env
```

## Lancement

```bash
npm start
```

Le dashboard est accessible sur [http://localhost:3000](http://localhost:3000).

## Docker

```bash
docker build -t sdlv-booker .
docker run -d --name sdlv-booker \
  --env-file .env \
  -p 3000:3000 \
  -v sdlv-booker-data:/app/data \
  sdlv-booker
```

Le volume `-v sdlv-booker-data:/app/data` persiste la base de donnees SQLite entre les redemarrages.

## Configuration

Les variables d'environnement necessaires (voir `.env.example`) :

| Variable | Description |
|---|---|
| `DOINSPORT_EMAIL` | Email du compte DoInSport |
| `DOINSPORT_PASSWORD` | Mot de passe du compte |
| `STRIPE_SOURCE_ID` | ID de la source Stripe (carte enregistree) |
| `STRIPE_PK` | Cle publique Stripe du club |
| `STRIPE_ACCOUNT` | ID du compte Stripe connecte du club |
| `CLUB_CLIENT_ID` | ID client du club DoInSport |
| `PORT` | Port du serveur (defaut : 3000) |

## Architecture

```
src/
  server.js          # Point d'entree Express
  api/
    auth.js          # Authentification DoInSport (JWT)
    doinsport.js     # Client API DoInSport (planning, booking, paiement)
    stripe-confirm.js # Confirmation Stripe.js via Playwright
  db/
    database.js      # SQLite (regles, logs)
  routes/
    api.js           # Routes REST (/api/rules, /api/bookings, etc.)
  scheduler/
    scheduler.js     # Cron J-45 + logique de reservation
public/
  index.html         # Dashboard
  app.js             # Frontend JS
  style.css          # Styles
  stripe-confirm.html # Page Stripe.js (utilisee par Playwright)
```
