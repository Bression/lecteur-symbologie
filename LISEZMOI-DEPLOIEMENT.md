# Identificateur de symbologie — déploiement

Application web (PWA) 100 % statique. Aucun serveur applicatif, aucune base de données, aucun appel externe.
Le décodage est fait sur le téléphone (WebAssembly) : aucune image ni donnée n'est envoyée au serveur.

## Mise en ligne
1. Copier **tout le contenu de ce dossier** sur le serveur web, dans un sous-dossier (ex. `https://serveur/symbologie/`).
2. **HTTPS obligatoire** : sans HTTPS, les navigateurs bloquent l'accès à la caméra.
3. Le serveur doit servir les fichiers `.wasm` avec le type MIME `application/wasm`
   et `.webmanifest` avec `application/manifest+json`.
   - IIS : ajouter ces deux types dans « Types MIME » s'ils n'existent pas.
4. Le téléphone doit pouvoir joindre le serveur (réseau interne, VPN ou accès authentifié), au moins pour
   le premier chargement. Ensuite l'appli fonctionne hors connexion.

## Mise à jour
Après modification d'un fichier, incrémenter la constante `CACHE` dans `sw.js`
(ex. `symbologie-v1.0.1`) pour que les téléphones récupèrent la nouvelle version.

## Contenu
- `index.html`, `style.css`, `app.js` : interface
- `knowledge.js` : référentiel symbologies, identifiants AIM, GS1, ISO 15434
- `decoder-worker.js` + `lib/` : moteur de décodage ZXing-C++ (licence Apache 2.0) via zxing-wasm (licence MIT)
- `sw.js`, `manifest.webmanifest`, `icons/` : installation et fonctionnement hors connexion
