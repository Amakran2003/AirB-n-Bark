# 🐕 AirB-n-Bark

**L'Airbnb pour les chiens** - Trouve la garde parfaite pour ton toutou !

---

## 🚀 Lancer le projet (5 minutes chrono)

### Ce qu'il te faut

1. **Docker Desktop** → [Télécharger ici](https://www.docker.com/products/docker-desktop/)
2. **Un terminal** (Terminal sur Mac/Linux, PowerShell/CMD sur Windows)

C'est tout ! Pas besoin d'installer Node.js, PostgreSQL, ou quoi que ce soit d'autre.

---

## 📦 Étape 1 : Clone le projet

Ouvre ton terminal et copie-colle :

```bash
git clone https://github.com/amakran2003/AirB-n-Bark.git
cd AirB-n-Bark
```

---

## ⚙️ Étape 2 : Configure le fichier .env

Copie le fichier d'exemple :

```bash
cp .env.example .env
```

**C'est tout !** Les valeurs par défaut fonctionnent pour le développement.

---

## 🐳 Étape 3 : Lance Docker

```bash
docker compose up --build
```

⏳ **Attends 2-3 minutes** la première fois (ça télécharge tout).

Pour voir si ça marche :
```bash
docker compose ps
```

Tu devrais voir tous les services en `running` ✅

---

## 🎉 C'est prêt !

Ouvre dans ton navigateur : **http://localhost:5173**

### Comptes de test

| Qui | Email | Mot de passe |
|-----|-------|--------------|
| 🏠 Hôte | marie@example.com | password123 |
| 🏠 Hôte | jean@example.com | password123 |
| 🐕 Rex | rex@wouf.dog | password123 |
| 🐕 Bella | bella@wouf.dog | password123 |
| 🐕 Max | max@wouf.dog | password123 |

---

## 📱 Tester sur ton téléphone

Tu veux voir l'app sur ton iPhone/Android ? Suis ces étapes :

### 1. Trouve l'IP de ton ordinateur

**Sur Mac :**
```bash
ipconfig getifaddr en0
```

**Sur Windows :**
```bash
ipconfig
```
→ Note l'adresse "IPv4" (genre `192.168.1.XX`)

### 2. Modifie le fichier .env

Ouvre le fichier `.env` à la racine du projet et change ces lignes :

```env
# Remplace localhost par ton IP (exemple: 192.168.1.42)
CORS_ORIGINS=http://localhost:5173,http://localhost,http://192.168.1.XX:5173,http://192.168.1.XX
VITE_API_URL=http://192.168.1.XX:3000/api
VITE_WOOBOT_URL=http://192.168.1.XX:3002
```

⚠️ **Remplace `192.168.1.XX` par TON IP !**

### 3. Relance Docker

```bash
docker compose down
docker compose up --build 
```

### 4. Ouvre sur ton téléphone

Sur ton téléphone (connecté au même WiFi), ouvre :

```
http://192.168.1.XX:5173
```

💡 **Installer comme une app** : L'app te proposera automatiquement de l'ajouter à l'écran d'accueil (popup sur Android, instructions sur iOS). Tu auras une vraie expérience "app native" !

---

## 🔧 Commandes utiles

### Voir ce qui tourne
```bash
docker compose ps
```

### Voir les logs (si ça marche pas)
```bash
docker compose logs -f api    # Logs du backend
docker compose logs -f web    # Logs du frontend
```

### Tout arrêter
```bash
docker compose down
```

### Tout recommencer de zéro
```bash
docker compose down -v         # Supprime aussi la base de données
docker compose up --build -d
```

### Voir la base de données (interface visuelle)
```bash
docker compose exec api npx prisma studio
```
→ Ouvre **http://localhost:5555**

---

## 🐛 Ça marche pas ?

### "Cannot connect to Docker daemon"
→ **Docker Desktop n'est pas lancé.** Ouvre l'application Docker Desktop.

### "Port already in use"
→ Un autre programme utilise le port. Ferme-le ou change le port dans `.env`.

### La page web ne charge pas
1. Vérifie que Docker tourne : `docker compose ps`
2. Regarde les logs : `docker compose logs -f web`

### Le téléphone ne se connecte pas
1. Vérifie que ton téléphone est sur le **même WiFi** que ton ordi
2. Vérifie que tu as bien changé l'IP dans `.env`
3. Vérifie que tu as relancé Docker après le changement

### Réinitialiser complètement
```bash
docker compose down -v
docker compose up --build -d
docker compose exec api npx prisma db push
docker compose exec api npx prisma db seed
```

---

## 📂 Structure du projet

```
AirB-n-Bark/
├── apps/
│   ├── api/          # Backend (Express + Prisma)
│   ├── web/          # Frontend (React + Vite)
│   └── woobot/       # Chatbot WooBot 🐕
├── .env.example      # Exemple de config
└── docker-compose.yml
```

---

## 🎨 Fonctionnalités

### Pour les voyageurs (guests)
- 🔍 Recherche avec filtres (ville, dates, prix, note)
- 📱 Interface swipe type Tinder
- 📅 Réservation de gardes
- 💳 Paiement (simulation Stripe)
- 💬 Messagerie avec les hôtes
- 🤖 Chatbot WooBot pour l'aide

### Pour les hôtes
- 🏠 Création d'annonces
- 📸 Upload de photos
- ✅ Gestion des réservations
- 💬 Messagerie avec les guests
- 📊 Dashboard

---

## � Stripe (Paiements)

Les clés Stripe dans le projet sont des **clés de TEST**. Aucun vrai paiement n'est possible.

Pour tester un paiement, utilise cette carte :
- **Numéro** : `4242 4242 4242 4242`
- **Date** : n'importe quelle date future
- **CVC** : n'importe quel nombre

---

## �📄 License

MIT © 2026 AirB-n-Bark
