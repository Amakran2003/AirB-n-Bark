# 🐕 AirB-n-Bark

**L'Airbnb pour les chiens** - Une plateforme de réservation de garde de chiens avec une expérience mobile-first inspirée d'Airbnb.

## 📋 Table des matières

- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Lancement du projet](#-lancement-du-projet)
- [Base de données](#-base-de-données)
- [Comptes de test](#-comptes-de-test)
- [Fonctionnalités](#-fonctionnalités)

---

## 🏗️ Architecture

```
AirB-n-Bark/
├── apps/
│   ├── api/          # Backend Express + Prisma + PostgreSQL
│   │   ├── prisma/   # Schéma DB, migrations, seed
│   │   └── src/      # Code source API
│   └── web/          # Frontend React + Vite + TypeScript
│       └── src/      # Code source Web
├── infra/            # Configuration infrastructure
└── docker-compose.yml
```

### Technologies utilisées

| Composant | Technologies |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Base de données** | PostgreSQL 16 |
| **Authentification** | JWT (JSON Web Tokens) |

---

## ✅ Prérequis

Avant de commencer, assure-toi d'avoir installé :

- **Node.js** v18+ → [nodejs.org](https://nodejs.org/)
- **PostgreSQL** v14+ → [postgresql.org](https://www.postgresql.org/)
- **npm** ou **yarn**

> 💡 **Alternative** : Tu peux utiliser Docker pour la base de données (voir section Docker)

---

## 🚀 Installation

### 1. Clone le repository

```bash
git clone https://github.com/ton-username/AirB-n-Bark.git
cd AirB-n-Bark
```

### 2. Installe les dépendances

```bash
# Backend
cd apps/api
npm install

# Frontend (dans un autre terminal)
cd apps/web
npm install
```

### 3. Configure les variables d'environnement

```bash
# Dans apps/api, copie le fichier d'exemple
cd apps/api
cp .env.example .env
```

Modifie le fichier `.env` avec tes paramètres :

```env
# Server
PORT=3001
NODE_ENV=development

# Database - IMPORTANT : adapte selon ta config PostgreSQL
DATABASE_URL=postgresql://postgres:ton_mot_de_passe@localhost:5432/airbnbark

# JWT (génère une clé secrète sécurisée en production)
JWT_SECRET=ta-cle-secrete-super-longue
JWT_EXPIRES_IN=7d

# CORS (ajoute ton IP locale pour tester sur mobile)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🎬 Lancement du projet

### Étape 1 : Démarre PostgreSQL

**Option A : PostgreSQL installé localement**
```bash
# macOS avec Homebrew
brew services start postgresql

# Vérifie que PostgreSQL tourne
psql -U postgres -c "SELECT version();"
```

**Option B : Avec Docker**
```bash
# Depuis la racine du projet
docker compose up db -d

# La DB sera accessible sur localhost:5143
# Pour se connecter depuis l'extérieur du container:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5143/airbnbark
```

---

### Étape 2 : Initialise la base de données

```bash
cd apps/api

# 1. Génère le client Prisma (nécessaire après chaque modif du schéma)
npx prisma generate

# 2. Crée les tables dans la base de données
npx prisma db push

# 3. Remplit la base avec des données de test
npx prisma db seed
```

#### 🔧 Explication des commandes Prisma

| Commande | Description |
|----------|-------------|
| `prisma generate` | Génère le client TypeScript Prisma à partir du schéma. **Obligatoire** après chaque modification de `schema.prisma` |
| `prisma db push` | Synchronise le schéma Prisma avec la base de données. Crée/modifie les tables sans créer de migration |
| `prisma db seed` | Exécute le script `seed.ts` pour insérer des données de test |
| `prisma migrate dev` | Crée une migration SQL et l'applique. Utilisé en développement pour garder un historique |
| `prisma studio` | Lance une interface web pour explorer/modifier les données |

> ⚠️ **Important** : `db push` est pratique pour le développement rapide, mais en production utilise `migrate deploy` pour garder un historique des changements.

---

### Étape 3 : Lance le Backend

```bash
cd apps/api
npm run dev
```

Le serveur démarre sur **http://localhost:3001**

Tu devrais voir :
```
🚀 Server running on http://localhost:3001
📊 Environment: development
```

---

### Étape 4 : Lance le Frontend

Dans un **nouveau terminal** :

```bash
cd apps/web
npm run dev
```

Le frontend démarre sur **http://localhost:5173**

---

### 🎉 C'est prêt !

Ouvre **http://localhost:5173** dans ton navigateur.

---

## 🗄️ Base de données

### Schéma principal

```
User ─────────────── Listing
  │                     │
  │                     ├── ListingAmenity
  │                     ├── ListingHighlight
  │                     ├── ListingRoom
  │                     ├── ListingRules
  │                     └── ListingAvailability
  │
  └── Booking ──────── Conversation ──── Message
        │
        └── Review
```

### Visualiser les données

```bash
cd apps/api
npx prisma studio
```

Ouvre **http://localhost:5555** pour explorer la base de données visuellement.

---

## 🔑 Comptes de test

Après avoir exécuté le seed, tu peux te connecter avec :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Hôte** | marie@example.com | password123 |
| **Hôte** | jean@example.com | password123 |
| **Guest** | guest@example.com | password123 |

---

## ✨ Fonctionnalités

### Guest (Voyageur)
- 🔍 Recherche de logements avec filtres (ville, dates, prix, note, capacité)
- 📅 Réservation avec sélection de dates
- 💳 Paiement (simulation)
- 💬 Messagerie avec les hôtes
- ⭐ Avis sur les séjours
- 📱 Interface mobile-first

### Host (Hôte)
- 🏠 Création et gestion d'annonces
- 📸 Upload de photos
- 📊 Dashboard avec statistiques
- ✅ Gestion des réservations (accepter/refuser)
- 💬 Messagerie avec les guests
- 📋 Instructions de séjour (check-in, WiFi, etc.)

### Filtres disponibles
- 🏙️ Ville (avec autocomplétion Nominatim)
- 📅 Dates de disponibilité
- 🐕 Nombre de chiens
- 🏠 Type (Niche, Nicholoc, Nichortoir)
- 💰 Prix min/max
- ⭐ Note minimum
- 🐱 Option anti-chat

---

## 🐳 Docker

Pour lancer tout le projet avec Docker :

```bash
# Depuis la racine du projet
docker compose up --build -d

# Première fois : initialise la base de données
docker compose exec api npx prisma db push
docker compose exec api npx prisma db seed

# Accède aux services :
# - Frontend : http://localhost:5173
# - Backend : http://localhost:3000
# - PostgreSQL : localhost:5143
# - Caddy (reverse proxy) : http://localhost:80
```

### Commandes Docker utiles

```bash
# Voir les logs
docker compose logs -f api
docker compose logs -f web

# Reconstruire après modifications
docker compose up --build -d

# Arrêter tous les services
docker compose down

# Réinitialiser (supprime les données)
docker compose down -v
docker compose up --build -d
```

### Exécuter des commandes dans les conteneurs

Pour exécuter des commandes dans un conteneur en cours d'exécution, utilise `docker compose exec` :

```bash
# Syntaxe : docker compose exec <service> <commande>

# === API (Backend) ===
# Ouvrir un shell dans le conteneur API
docker compose exec api sh

# Lancer Prisma Studio (visualiser la BDD)
docker compose exec api npx prisma studio

# Appliquer les migrations Prisma
docker compose exec api npx prisma migrate deploy

# Régénérer le client Prisma
docker compose exec api npx prisma generate

# Réinitialiser la base de données
docker compose exec api npx prisma db push --force-reset
docker compose exec api npx prisma db seed

# === WEB (Frontend) ===
# Ouvrir un shell dans le conteneur Web
docker compose exec web sh

# === DB (PostgreSQL) ===
# Se connecter à PostgreSQL en ligne de commande
docker compose exec db psql -U postgres -d airbnbark

# Lister les tables
docker compose exec db psql -U postgres -d airbnbark -c "\\dt"

# Exécuter une requête SQL
docker compose exec db psql -U postgres -d airbnbark -c "SELECT * FROM \"User\" LIMIT 5;"
```

> 💡 **Astuce** : `docker compose exec` exécute une commande dans un conteneur **en cours d'exécution**. Si le conteneur n'est pas démarré, utilise `docker compose run` à la place.

### Architecture Docker

| Service | Port exposé | Description |
|---------|-------------|-------------|
| **db** | 5143 | PostgreSQL 16 |
| **api** | 3000 | Backend Express |
| **web** | 5173 | Frontend Vite |
| **caddy** | 80, 443 | Reverse proxy |

---

## 📱 Test sur mobile

Pour tester sur ton téléphone (même réseau WiFi) :

1. Trouve ton IP locale :
   ```bash
   # macOS
   ipconfig getifaddr en0
   ```

2. Ajoute ton IP dans `apps/api/.env` :
   ```env
   CORS_ORIGINS=http://localhost:5173,http://192.168.1.XX:5173
   ```

3. Lance le frontend avec host :
   ```bash
   cd apps/web
   npm run dev -- --host
   ```

4. Sur ton téléphone, ouvre `http://192.168.1.XX:5173`

---

## 📝 Commandes utiles

```bash
# === BACKEND ===
cd apps/api
npm run dev          # Lance en mode développement
npm run build        # Compile TypeScript
npm run start        # Lance en production
npm run test         # Lance les tests

# === PRISMA ===
npx prisma generate  # Génère le client
npx prisma db push   # Sync schema → DB
npx prisma db seed   # Insère données de test
npx prisma studio    # Interface visuelle
npx prisma migrate dev --name description  # Crée une migration

# === FRONTEND ===
cd apps/web
npm run dev          # Lance en mode développement
npm run build        # Build pour production
npm run preview      # Prévisualise le build
```

---

## 🐛 Résolution de problèmes

### "Database does not exist"
```bash
# Crée la base manuellement
psql -U postgres -c "CREATE DATABASE airbnbark;"
```

### "Prisma Client not generated"
```bash
cd apps/api
npx prisma generate
```

### "Port already in use"
```bash
# Trouve le processus
lsof -i :3001
# Tue le processus
kill -9 <PID>
```

### Réinitialiser la base de données
```bash
cd apps/api
npx prisma db push --force-reset
npx prisma db seed
```

---

## 📄 License

MIT © 2026 AirB-n-Bark
