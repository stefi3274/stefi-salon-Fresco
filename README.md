# 🧊 SteFi Salon – Pression STOP

Application PWA de gestion des comptes du SteFi Salon.

## Structure
```
stefi-salon/
├── index.html          ← Page principale
├── manifest.json       ← Config PWA (installable)
├── sw.js               ← Service Worker (offline)
├── css/
│   └── style.css       ← Tous les styles
├── js/
│   ├── supabase.js     ← Client Supabase
│   └── app.js          ← Logique de l'app
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Déploiement sur GitHub Pages

1. Crée un repo GitHub : `stefi3274/stefi-salon`
2. Pousse tous les fichiers :
```bash
git init
git add -A
git commit -m "SteFi Salon – Pression STOP v1"
git remote add origin https://github.com/stefi3274/stefi-salon.git
git push -u origin main
```
3. Dans GitHub → Settings → Pages → Source : `main` branch
4. L'app sera accessible à : `https://stefi3274.github.io/stefi-salon/`

## Installer sur Android
1. Ouvre l'URL dans Chrome
2. Menu (⋮) → "Ajouter à l'écran d'accueil"
3. L'app s'installe comme une vraie app 📱

## Installer sur iPhone
1. Ouvre l'URL dans Safari
2. Bouton Partager → "Sur l'écran d'accueil"

## Entreprise ID
`cc0bec95-bcf1-46ac-a364-dc63bb22a2e5` (SteFi Salon)
