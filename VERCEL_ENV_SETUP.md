# 🔧 Configuration des Variables d'Environnement Vercel

## Variables à Configurer

Allez sur : **https://vercel.com/tigdittgolf-9191s-projects/[nom-projet]/settings/environment-variables**

### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://szgodrjglbpzkrksnroi.supabase.co
```
- Environment: **Production**

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
```
- Environment: **Production**

### 3. SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
```
- Environment: **Production**

### 4. JWT_SECRET
```
St_Article_2025_Super_Secret_JWT_Key_256_Bits_Production_Ready_Token_Security
```
- Environment: **Production**

### 5. NEXT_PUBLIC_API_URL
```
https://frontend-dcay82cpv-tigdittgolf-9191s-projects.vercel.app/api
```
- Environment: **Production**

### 6. NODE_ENV
```
production
```
- Environment: **Production**

## 📋 Étapes de Configuration

1. **Connectez-vous à Vercel** : https://vercel.com
2. **Allez dans votre projet** : tigdittgolf-9191s-projects/[nom-projet]
3. **Cliquez sur "Settings"** dans le menu du haut
4. **Cliquez sur "Environment Variables"** dans le menu latéral
5. **Pour chaque variable** :
   - Cliquez sur "Add New"
   - Entrez le nom de la variable (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - Entrez la valeur
   - Sélectionnez "Production"
   - Cliquez sur "Save"

## 🔄 Après Configuration

Une fois toutes les variables ajoutées, **redéployez** votre application :

```bash
cd frontend
vercel --prod
```

Ou attendez que Vercel redéploie automatiquement (si vous avez configuré le Git integration).

## ✅ Vérification

Testez ces URLs après le redéploiement :

1. **Homepage** : https://frontend-dcay82cpv-tigdittgolf-9191s-projects.vercel.app
2. **Login** : https://frontend-dcay82cpv-tigdittgolf-9191s-projects.vercel.app/login
3. **API Health** : https://frontend-dcay82cpv-tigdittgolf-9191s-projects.vercel.app/api/health

## 🔐 Configuration Supabase

N'oubliez pas de mettre à jour les URLs autorisées dans Supabase :

1. Allez sur : https://supabase.com/dashboard/project/szgodrjglbpzkrksnroi
2. **Authentication** → **URL Configuration**
3. Ajoutez :
   - **Site URL** : `https://frontend-dcay82cpv-tigdittgolf-9191s-projects.vercel.app`
   - **Redirect URLs** : `https://frontend-dcay82cpv-tigdittgolf-9191s-projects.vercel.app/auth/callback`
