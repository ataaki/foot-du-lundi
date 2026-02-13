# Foot Du Lundi

Bot de réservation automatique pour les terrains de football à **Sport dans la Ville** via l'API [DoInSport](https://doinsport.club).

## Fonctionnalités

- **Réservation automatique J-45** : configure des règles (jour + heure + durée) et le bot réserve automatiquement dès que le créneau ouvre, 45 jours à l'avance
- **Préférences de terrains** : choisis l'ordre de priorité des terrains, le bot prend le meilleur disponible
- **Réservation manuelle** : parcours les créneaux disponibles et réserve en un clic
- **Paiement automatique** : pipeline complet booking → panier → paiement → confirmation Stripe.js (gère le 3DS)
- **Dashboard web** : interface PWA installable pour gérer les règles, voir les réservations et l'historique
- **Configuration automatique** : les variables Stripe et le club client ID sont retrouvés automatiquement depuis l'API DoInSport
- **Setup depuis l'interface** : les identifiants DoInSport se configurent directement depuis le dashboard au premier lancement

## Stack

- **Backend** : Node.js, Express 5, better-sqlite3, node-cron
- **Frontend** : HTML/CSS/JS vanilla (PWA installable)
- **Paiement** : Playwright (headless Chromium) pour la confirmation Stripe.js
- **Base de données** : SQLite (fichier local `data/bookings.db`)

## Installation

```bash
git clone https://github.com/<user>/foot-du-lundi.git
cd foot-du-lundi
npm install
npx playwright install chromium
```

## Configuration

Au premier lancement, le dashboard affiche un **écran de connexion** pour renseigner tes identifiants DoInSport. Ils sont stockés localement dans la base SQLite et peuvent être modifiés à tout moment via le bouton ⚙ dans le header.

Le fichier `.env` est optionnel et ne sert qu'à configurer le port :

| Variable | Description |
|---|---|
| `PORT` | Port du serveur (optionnel, défaut : 3000) |

Les variables Stripe (`STRIPE_PK`, `STRIPE_ACCOUNT`, `STRIPE_SOURCE_ID`) et le `CLUB_CLIENT_ID` sont **automatiquement récupérés** depuis l'API DoInSport après connexion.

> **Prérequis** : tu dois avoir fait au moins **un paiement** via l'app DoInSport pour que le bot puisse retrouver ton moyen de paiement Stripe.

## Lancement

```bash
npm start
```

Le dashboard est accessible sur [http://localhost:3000](http://localhost:3000).

## Docker

```bash
docker compose up -d
```

Ou sans Docker Compose :

```bash
docker build -t foot-du-lundi .
docker run -d --name foot-du-lundi \
  -p 3000:3000 \
  -v foot-du-lundi-data:/app/data \
  foot-du-lundi
```

Le volume persiste la base de données SQLite (dont les identifiants) entre les redémarrages. Aucun `--env-file` n'est nécessaire : les identifiants se configurent via l'interface web.

## Architecture

```
src/
  server.js              # Point d'entrée Express
  api/
    auth.js              # Authentification DoInSport (JWT)
    config-resolver.js   # Auto-résolution Stripe & club config
    doinsport.js         # Client API DoInSport (planning, booking, paiement)
    stripe-confirm.js    # Confirmation Stripe.js via Playwright
  db/
    database.js          # SQLite (règles, logs, settings)
  routes/
    api.js               # Routes REST (/api/rules, /api/bookings, etc.)
  scheduler/
    scheduler.js         # Cron J-45 + logique de réservation
public/
  index.html             # Dashboard (PWA)
  app.js                 # Frontend JS
  style.css              # Styles
  stripe-confirm.html    # Page Stripe.js (utilisée par Playwright)
  manifest.json          # Manifest PWA
  sw.js                  # Service Worker
```
