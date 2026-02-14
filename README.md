# Foot Du Lundi

Bot de réservation automatique pour les terrains de football à **Sport dans la Ville** via l'API [DoInSport](https://doinsport.club).

## Fonctionnalités

- **Réservation automatique J-45** : configure des règles (jour + heure + durée) et le bot réserve automatiquement dès que le créneau ouvre, 45 jours à l'avance
- **Préférences de terrains** : choisis l'ordre de priorité des terrains (drag & drop), le bot prend le meilleur disponible
- **Réservation manuelle** : parcours les créneaux disponibles et réserve en un clic
- **Paiement automatique** : pipeline complet booking → panier → paiement → confirmation Stripe.js (gère le 3DS et le traitement bancaire asynchrone)
- **Dashboard web** : interface React PWA installable avec dark mode pour gérer les règles, voir les réservations et l'historique
- **Notifications Telegram** : reçois une alerte quand une réservation est effectuée ou échoue
- **Configuration automatique** : les variables Stripe et le club client ID sont retrouvés automatiquement depuis l'API DoInSport
- **Setup depuis l'interface** : les identifiants DoInSport se configurent directement depuis le dashboard au premier lancement
- **Identifiants chiffrés** : le mot de passe DoInSport est chiffré (AES-256-GCM) dans la base SQLite
- **Graceful shutdown** : les paiements en cours sont protégés lors d'un redémarrage Docker

## Stack

- **Backend** : Node.js, Express 5, better-sqlite3, node-cron
- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS 4, Headless UI
- **Paiement** : Playwright (headless Chromium) pour la confirmation Stripe.js
- **Base de données** : SQLite avec WAL mode, migrations versionnées (`schema_version`)

## Installation

```bash
git clone https://github.com/<user>/foot-du-lundi.git
cd foot-du-lundi
npm install
npx playwright install chromium
cd frontend && npm install
```

## Configuration

Au premier lancement, le dashboard affiche un **écran de connexion** pour renseigner tes identifiants DoInSport. Ils sont stockés localement dans la base SQLite (mot de passe chiffré) et peuvent être modifiés à tout moment via le bouton ⚙ dans le header.

Le fichier `.env` est optionnel et ne sert qu'à configurer le port :

| Variable | Description |
|---|---|
| `PORT` | Port du serveur (optionnel, défaut : 3000) |

Les variables Stripe (`STRIPE_PK`, `STRIPE_ACCOUNT`, `STRIPE_SOURCE_ID`) et le `CLUB_CLIENT_ID` sont **automatiquement récupérés** depuis l'API DoInSport après connexion.

> **Prérequis** : tu dois avoir fait au moins **un paiement** via l'app DoInSport pour que le bot puisse retrouver ton moyen de paiement Stripe.

## Lancement

### Développement

```bash
# Backend
npm start

# Frontend (dans un autre terminal)
cd frontend && npm run dev
```

### Production

```bash
# Build le frontend puis lance le serveur
cd frontend && npm run build && cd ..
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

Le volume persiste la base de données SQLite (dont les identifiants chiffrés) entre les redémarrages. Aucun `--env-file` n'est nécessaire : les identifiants se configurent via l'interface web.

Les variables `PUID` et `PGID` peuvent être passées en build args pour matcher l'utilisateur hôte :

```bash
docker build --build-arg PUID=$(id -u) --build-arg PGID=$(id -g) -t foot-du-lundi .
```

## Architecture

```
src/
  server.js              # Point d'entrée Express + graceful shutdown
  api/
    auth.js              # Authentification DoInSport (JWT)
    config-resolver.js   # Auto-résolution Stripe & club config
    doinsport.js         # Client API DoInSport (planning, booking, paiement)
    stripe-confirm.js    # Confirmation Stripe.js via Playwright (avec sémaphore)
  constants.js           # Constantes centralisées (terrains, durées, statuts)
  db/
    database.js          # SQLite (règles, logs, settings, migrations versionnées, chiffrement)
  middleware/
    error-handler.js     # Gestion centralisée des erreurs
  routes/
    api.js               # Routes REST (/api/rules, /api/bookings, etc.)
  scheduler/
    scheduler.js         # Cron J-45 + logique de réservation
  services/
    booking.js           # Orchestration recherche + création de réservation
    payment.js           # Pipeline de paiement centralisé
    logging.js           # Helpers de journalisation
    telegram.js          # Notifications Telegram
  utils/
    validators.js        # Validation des entrées (règles, durées, dates)
    id-helpers.js        # Extraction d'UUID depuis les réponses API
    json-helpers.js      # Parsing des préférences de terrains

frontend/
  src/
    App.tsx              # Application principale (tabs, auth flow)
    api/client.ts        # Client HTTP centralisé
    types/index.ts       # Types TypeScript
    hooks/               # Hooks React (rules, bookings, slots, theme, toast)
    components/
      layout/            # Header, StatsBar
      rules/             # RuleCard, RuleForm, PlaygroundPrefs (drag & drop)
      bookings/          # BookingsList, Pagination
      manual/            # SlotSearch, SlotResults
      logs/              # LogsTable
      setup/             # SetupScreen (premier lancement)
      ui/                # Button, Badge, Spinner, Toast, ConfirmDialog, Toggle
    lib/format.ts        # Formatage prix, durées, dates

public/
  stripe-confirm.html    # Page Stripe.js (utilisée par Playwright)
  icon.svg               # Icône PWA
```
