Avancement – Initialisation (premier commit) : AirBnBark

1) Ce que j’ai mis en place (première base du projet)

J’ai initialisé le dépôt en monorepo avec une séparation claire :
	•	apps/api : backend Node/Express en TypeScript
	•	apps/web : frontend React (Vite) en TypeScript, avec TailwindCSS
	•	infra/ :
	•	infra/caddy/Caddyfile : reverse proxy centralisé
	•	docker-compose.yml à la racine pour lancer toute la stack
	•	.github/workflows/build-push.yml : workflow CI/CD (présent mais pas finalisé)

2) Backend : état actuel et intention

Pour le backend, j’ai mis le minimum afin de pouvoir lancer le projet dès le premier commit.
	•	Le backend contient une structure modulaire par domaines importants :
	•	auth, booking, listings, reviews
	•	Chaque domaine a une arborescence MVC :
	•	routes/, controllers/, models/, services/, index.ts
	•	Les fichiers racine app.ts et server.ts permettent de démarrer l’API.

Important : le code backend actuel a été généré avec l’IA et reste volontairement minimal.
L’objectif était de fournir une base de démarrage. Ensuite, ceux qui gèrent le backend pourront modifier librement la logique, les endpoints, la DB, etc. La structure “microservices” est là surtout pour donner un cadre.

3) Frontend : choix et base

Côté front :
	•	Front en React + Vite + TypeScript
	•	Styling prévu avec TailwindCSS
	•	Assets PWA présents dans apps/web/public (icônes)

4) Docker Compose : stack exécutable

J’ai ajouté docker-compose.yml pour lancer :
	•	db : PostgreSQL
	•	api : backend
	•	web : frontend
	•	caddy : reverse proxy

L’objectif de cette étape était d’avoir un projet runnable rapidement en local, avec un point d’entrée unique via Caddy.

5) Caddy : état actuel (local) et suite (prod)

Le Caddyfile est bien présent dans infra/caddy/Caddyfile.
	•	Pour l’instant, il est configuré en HTTP (port 80) car on n’a pas encore déployé ni configuré le domaine.
	•	Dès qu’on déploie, on passera sur une config avec nom de domaine + HTTPS (port 443) 

6) GitHub Actions : présent mais à finaliser

J’ai ajouté .github/workflows/build-push.yml, mais il n’est pas terminé.

Il me reste à :
	•	le corriger/compléter pour qu’il soit cohérent avec notre déploiement (images build/push + déploiement sur instance Scaleway),
	•	et l’aligner avec la stack Docker Compose / Caddy / domaine.

⸻

Conclusion (à retenir pour l’équipe)

Ce premier commit fournit :
	•	une base de repo propre (apps/api, apps/web, infra),
	•	un backend minimal (généré par IA) juste pour démarrer + structure MVC par domaines,
	•	un frontend prêt (React/Vite/TS + Tailwind),
	•	une stack docker-compose exécutable,
	•	un Caddyfile déjà en place (HTTP pour l’instant),
	•	un workflow GitHub Actions présent mais à finaliser.
---

Avancement – Session Frontend (21 Janvier 2026)

1) Architecture Frontend : Choix et Organisation

Design System centralisé (index.css)

J'ai créé un design system complet dans index.css pour garantir la cohérence visuelle :
	•	Variables CSS : --color-primary, --color-bg-secondary, --color-border, etc.
	•	Classes réutilisables : .btn-primary, .btn-secondary, .input, .card, .divider
	•	Typographie : .text-h1, .text-h2, .text-body-md, .text-caption

Choix : Utiliser uniquement les classes du design system dans les composants, pas de styles custom ad-hoc. Cela facilite la maintenance et garantit une UI cohérente.

Données mockées (data/listings.ts)

J'ai centralisé toutes les données dans data/listings.ts avec des interfaces TypeScript strictes :
	•	ListingCardData : données pour les cartes swipables
	•	ListingFullData : données complètes pour la page détails
	•	Types métier : ListingType, AntiCatOption, ListingHost, etc.

Choix : Séparer les données du code UI pour faciliter l'intégration future avec l'API. Le backend pourra retourner exactement ces structures.

Contexts pour l'état global
	•	AuthContext : gestion de l'authentification (modal, état connecté)
	•	FilterContext : gestion des filtres avec fonction prête pour l'API

2) Fonctionnalités implémentées

Système de Filtres complet
	•	FilterModal : Modal avec dates, types de niche, prix, option anti-chat, rating
	•	DatePicker : Calendrier custom pour sélection check-in/check-out
	•	Filtrage local : Les listings sont filtrés côté front en attendant l'API

Choix UX pour le calendrier :
	•	Si on clique sur une date avant le check-in actuel → elle devient le nouveau check-in
	•	Si les deux dates sont déjà sélectionnées et qu'on reclique → reset, nouvelle sélection
	•	Fermer le modal (croix ou backdrop) → les filtres sont quand même enregistrés

Page BookingRecap
	•	Récap de réservation avec dates modifiables
	•	Calcul dynamique du nombre de nuits et du prix total
	•	Intégration du DatePicker pour modifier les dates
	•	Bouton "Next" désactivé si dates non sélectionnées

Optimisations Performance
	•	Images avec loading="lazy" et decoding="async"
	•	Preload de l'image LCP dans index.html
	•	Images placeholder locales (SVG) pour éviter les requêtes réseau externes

3) Préparation pour l'API Backend

Le code frontend est structuré pour une intégration facile avec le backend. Les données mockées dans data/listings.ts utilisent des interfaces TypeScript qui définissent le contrat entre front et back. Le FilterContext contient déjà les fonctions utilitaires pour construire les query params et appeler l'API.

4) Utilisation de l'IA (GitHub Copilot / Claude)

Méthodologie

J'ai utilisé l'IA comme assistant de développement, en lui donnant des directives précises et en validant chaque implémentation. L'approche était itérative : je décrivais le besoin fonctionnel, l'IA proposait une solution, et j'affinais avec des prompts de correction.

Exemples de prompts utilisés

Création du système de filtres :
"Je veux implémenter un système de filtres complet pour l'application. L'utilisateur doit pouvoir sélectionner des dates (arrivée/départ), choisir le type de niche, définir une fourchette de prix, et filtrer par rating. Utilise les classes de mon design system existant dans index.css. Le code doit être prêt pour une intégration future avec l'API backend."

Logique du calendrier (comportement UX spécifique) :
"Pour le DatePicker, je veux un comportement intuitif : si l'utilisateur a déjà sélectionné une date d'arrivée (par exemple le 26 février) mais pas encore de date de départ, et qu'il clique sur une date antérieure (par exemple le 10 février), alors cette nouvelle date doit devenir la date d'arrivée. Cela évite de forcer l'utilisateur à reset manuellement."

Comportement de sauvegarde du modal :
"Je veux que lorsque l'utilisateur ferme le modal de filtres (que ce soit en cliquant sur la croix ou en cliquant en dehors), ses sélections soient automatiquement sauvegardées. Il ne doit pas y avoir de bouton 'Appliquer' séparé, la fermeture suffit à valider les choix."

Animation swipe retour style iOS :
"Je veux implémenter une animation de retour style iOS sur la page ListingDetails. Quand l'utilisateur swipe vers la droite depuis le bord gauche de l'écran, la page doit suivre le doigt et glisser vers la droite. Si le swipe dépasse un certain seuil, la page se ferme complètement. Sinon, elle revient à sa position initiale avec une transition fluide. Utilise les événements touch (touchstart, touchmove, touchend) pour gérer le geste."

Animation navbar au scroll :
"Sur la page ListingDetails, je veux que la navbar soit transparente quand l'image est visible, puis devienne blanche progressivement quand l'utilisateur scrolle vers le bas. Quand le bloc de contenu scrollable atteint le haut de l'écran, il doit passer en dessous de la navbar (qui est maintenant blanche avec un léger shadow). L'image doit aussi faire un fade-out progressif pendant le scroll. Calcule un seuil basé sur la hauteur de l'image et de la navbar pour déclencher la transition."

Animation zoom au clic sur une carte :
"Quand l'utilisateur clique sur une carte swipable, je veux une animation de zoom progressif avant d'ouvrir la page détails. La carte doit d'abord légèrement grossir (scale 1.05), puis faire un zoom plus important (scale 1.5) pour donner l'impression qu'elle s'ouvre en plein écran. L'animation doit être fluide avec des timings précis entre chaque étape."

Ce que l'IA a bien fait
	•	Génération rapide de composants React conformes au design system
	•	Création des interfaces TypeScript strictes pour les données
	•	Logique métier du calendrier avec gestion des cas limites
	•	Animations de navigation : swipe retour iOS, navbar dynamique au scroll, zoom au clic (code fonctionnel dès la première génération)

Ce que j'ai dû corriger/guider
	•	L'IA proposait parfois des attributs non reconnus par React/TypeScript (fetchPriority vs fetchpriority)
	•	J'ai dû insister pour utiliser uniquement les classes du design system existant, pas de styles inline
	•	Certains choix UX nécessitaient des explications détaillées pour obtenir le comportement souhaité
	•	Ajustement des animations : L'IA a généré exactement les animations que je voulais, mais j'ai dû modifier manuellement les valeurs (timing, seuils de déclenchement, distances) pour obtenir un rendu fluide, car l'IA ne peut pas voir le résultat visuel en temps réel

---

5) Améliorations UX supplémentaires

Swipe-to-close sur les modals

J'ai ajouté la possibilité de fermer les modals en swipant vers le bas, pour une expérience mobile native :

Prompt utilisé :
"Pour tous les modals (FilterModal, DatePicker, AuthModal), je veux ajouter un geste de swipe vers le bas pour les fermer. Ajoute un indicateur visuel (barre grise) en haut du modal. Quand l'utilisateur swipe vers le bas et dépasse un seuil de 100px, le modal se ferme. Sinon, il revient à sa position initiale avec une transition fluide."

Isolation des touch events (problème de scroll)

Un bug faisait que le scroll d'un modal affectait le contenu en arrière-plan. J'ai dû utiliser la technique touch-none / touch-auto :

Prompt utilisé :
"Il y a un bug : quand je swipe le contenu d'un modal, ça scroll aussi la page derrière. Utilise la même logique de structure que dans ListingDetails pour isoler les touch events. Ajoute touch-none sur le container principal et touch-auto sur la zone scrollable uniquement."

Solution technique :
	•	touch-none sur le backdrop/container principal → bloque tous les touch events
	•	touch-auto sur le contenu scrollable → réactive le touch seulement là où c'est nécessaire
	•	overscroll-contain pour empêcher le scroll de se propager

Cette technique a été appliquée sur :
	•	BookingRecap : structure flex avec header/content/footer, scroll isolé dans le content
	•	FilterModal, DatePicker, AuthModal : backdrop touch-none, modal touch-auto

---

6) ChatBot : Intégration n8n et UX Mobile

Composant ChatBot

J'ai créé un composant ChatBot complet avec :
	•	Interface de chat avec messages user/bot
	•	Intégration webhook n8n (VITE_N8N_WEBHOOK_URL)
	•	Mode demo avec réponses prédéfinies quand n8n n'est pas configuré
	•	Swipe-to-close sur le header (cohérent avec les autres modals)

Problèmes UX rencontrés et solutions

**Problème 1 : Modal qui dépasse en haut quand le clavier s'ouvre**

Sur iOS, quand le clavier s'ouvre, le viewport se réduit et le modal de hauteur fixe (85vh) dépassait en haut de l'écran.

Solution : Utilisation de l'API `visualViewport` pour adapter dynamiquement la hauteur du modal :
```tsx
useEffect(() => {
    const updateHeight = () => {
        if (window.visualViewport) {
            const vh = window.visualViewport.height;
            const maxHeight = vh - 20; // 20px de marge en haut
            const targetHeight = Math.min(vh * 0.85, maxHeight);
            setModalHeight(`${targetHeight}px`);
            setIsKeyboardOpen(initialHeight - vh > 100);
        }
    };
    window.visualViewport.addEventListener('resize', updateHeight);
}, [isOpen]);
```

**Problème 2 : Safe area trop grande avec le clavier ouvert**

J'avais initialement `paddingBottom: env(safe-area-inset-bottom)` sur l'input, mais ça créait un espace trop grand entre l'input et le clavier iOS.

Solution : Utiliser `pb-9` uniquement quand le clavier est fermé

**Problème 3 : Modal "yo-yo" au clic sur le bouton envoyer**

Quand on cliquait sur le bouton envoyer, l'input perdait le focus → clavier se ferme → modal remonte → refocus → clavier s'ouvre → modal redescend.

Solution : Empêcher le bouton de prendre le focus avec `preventDefault`
---

## 7) Système de Disponibilité et Capacité

### Modèle de données étendu

J'ai enrichi le modèle `ListingCardData` avec de nouveaux champs pour gérer la disponibilité :

```typescript
interface DateRange {
    start: string; // Format YYYY-MM-DD
    end: string;
}

interface ListingCardData {
    // ... champs existants
    maxDogs: number;                    // Capacité max de chiens
    availableDateRanges: DateRange[];   // Plages de disponibilité
}
```

Toutes les 10 annonces mock ont été mises à jour avec ces données réalistes (maxDogs de 1 à 4, plusieurs plages de dates par annonce).

### Sélecteur de voyageurs (chiens)

Ajout d'un compteur +/- dans deux endroits :
- **FilterModal** : Sélection globale du nombre de chiens (1-10)
- **BookingRecap** : Ajustement avant réservation (limité par `maxDogs` de l'annonce)

Design : Boutons ronds avec icônes Minus/Plus, désactivés aux limites min/max.

### Filtrage intelligent

Le `FilterContext` filtre maintenant les annonces selon :
1. **Capacité** : `listing.maxDogs >= filters.dogsCount`
2. **Disponibilité** : Les dates sélectionnées doivent être incluses dans au moins une `availableDateRange`

### Validation des réservations

Dans `BookingRecap`, deux validations bloquantes 

Si validation échouée :
- Message d'erreur rouge avec icône AlertTriangle
- Bouton "Réservation impossible" grisé et désactivé

### Annulation gratuite conditionnelle

L'affichage "Annulation gratuite" dans BookingRecap dépend maintenant du champ `hasFreeCancellation` de chaque annonce 

---

## 8) AuthModal : Gestion du clavier iOS

Même problème et solution que pour ChatBot : le modal remontait quand le clavier s'ouvrait.

Cette solution a été appliquée à tous les modals avec input : AuthModal et ChatBot.

---

## 9) Bug fixes

### DatePicker : Correction de la sélection de date d'arrivée

**Problème** : Si l'utilisateur avait sélectionné uniquement une date de départ (checkout), il ne pouvait plus sélectionner une date d'arrivée - le clic ne faisait rien.

**Solution** : Ajout d'une condition pour toujours permettre de définir le check-in s'il n'existe pas 

