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