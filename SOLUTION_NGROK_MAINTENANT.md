# 🚀 Solution Ngrok - Exposer le Backend

## Problème Actuel

Vercel ne peut pas accéder à votre backend via Tailscale (réseau privé).
Les routes API Next.js essaient d'accéder à Supabase mais les variables sont manquantes.

## Solution: Ngrok + Variables Supabase

### Étape 1: Installer et Configurer Ngrok

```powershell
# Installer ngrok (si pas déjà fait)
choco install ngrok

# Ou télécharger depuis https://ngrok.com/download

# Créer un compte gratuit sur https://ngrok.com/signup
# Copier votre authtoken

# Configurer ngrok
ngrok config add-authtoken VOTRE_TOKEN_ICI
```

### Étape 2: Démarrer le Backend Local

```powershell
cd backend
bun run dev
# Le backend démarre sur http://localhost:3005
```

### Étape 3: Créer le Tunnel Ngrok

Dans un nouveau terminal:

```powershell
ngrok http 3005
```

Vous verrez quelque chose comme:
```
Forwarding  https://abc123-xyz.ngrok-free.app -> http://localhost:3005
```

**Copiez cette URL!** (ex: `https://abc123-xyz.ngrok-free.app`)

### Étape 4: Configurer Vercel

Allez sur https://vercel.com/dashboard → st-article-1 → Settings → Environment Variables

Ajoutez ces variables pour **Production, Preview, Development**:

#### Variables Supabase (pour les routes API Next.js)
```
NEXT_PUBLIC_SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
SUPABASE_URL = https://szgodrjglbpzkrksnroi.supabase.co
```

#### Variable Backend (pour les routes qui proxy vers le backend)
```
BACKEND_URL = https://abc123-xyz.ngrok-free.app
NEXT_PUBLIC_API_URL = https://abc123-xyz.ngrok-free.app/api
```

⚠️ **Remplacez `https://abc123-xyz.ngrok-free.app` par VOTRE URL ngrok!**

### Étape 5: Redéployer

Vercel redéploiera automatiquement après avoir ajouté les variables.
Ou forcez un redéploiement:

```powershell
cd frontend
git commit --allow-empty -m "chore: Trigger redeploy with ngrok"
git push
```

### Étape 6: Tester

Attendez 2-3 minutes puis testez:
- BL de Vente: `https://votre-app.vercel.app/delivery-notes/list`
- BL d'Achat: `https://votre-app.vercel.app/purchases/delivery-notes/list`

## ⚠️ Important

### Ngrok Gratuit
- L'URL change à chaque redémarrage de ngrok
- Vous devez garder ngrok ouvert en permanence
- Limite de 40 connexions/minute

### Quand Ngrok Redémarre
Si vous redémarrez ngrok, vous aurez une nouvelle URL. Vous devrez:
1. Copier la nouvelle URL
2. Mettre à jour `BACKEND_URL` et `NEXT_PUBLIC_API_URL` dans Vercel
3. Attendre le redéploiement

## 🎯 Architecture Finale

```
[Utilisateur]
    ↓
[Vercel Frontend]
    ↓
    ├─→ Routes API Next.js (/api/purchases, /api/sales)
    │   └─→ Supabase directement (via SUPABASE_SERVICE_ROLE_KEY)
    │
    └─→ Autres routes (si nécessaire)
        └─→ Ngrok Tunnel
            └─→ Backend Local (localhost:3005)
                └─→ Supabase
```

## 💡 Alternative: Tout via Supabase

Si vous voulez éviter ngrok, vous pouvez:
1. Utiliser uniquement les routes API Next.js
2. Toutes les routes appellent Supabase directement
3. Pas besoin de backend séparé

Dans ce cas, ajoutez seulement les variables Supabase dans Vercel (pas besoin de BACKEND_URL).

## 🆘 Dépannage

### Erreur "tunnel not found"
- Vérifiez que ngrok est bien démarré
- Vérifiez que le backend tourne sur le port 3005

### Erreur 502 Bad Gateway
- Le backend local n'est pas accessible
- Vérifiez que le backend tourne
- Vérifiez que ngrok pointe vers le bon port

### Erreur 500 sur les routes API
- Les variables Supabase sont manquantes dans Vercel
- Vérifiez que vous avez bien ajouté toutes les variables
- Attendez le redéploiement complet

## 📝 Checklist

- [ ] Ngrok installé et configuré
- [ ] Backend local démarré (port 3005)
- [ ] Tunnel ngrok créé
- [ ] URL ngrok copiée
- [ ] Variables Supabase ajoutées dans Vercel
- [ ] Variables Backend (BACKEND_URL, NEXT_PUBLIC_API_URL) ajoutées dans Vercel
- [ ] Frontend redéployé
- [ ] Tests effectués
