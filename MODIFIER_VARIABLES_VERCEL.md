# 🔧 Modifier les Variables d'Environnement Vercel

## ✅ Bonne Nouvelle !

Les variables existent déjà, il faut juste les MODIFIER avec les bonnes valeurs.

## 📋 Variables à Modifier

### 1. BACKEND_URL

**Trouver la variable:**
- Dans la liste, cherche `BACKEND_URL`
- Clique sur les 3 points (...) à droite
- Clique sur "Edit"

**Nouvelle valeur:**
```
https://midi-charm-harvard-performed.trycloudflare.com
```

**Ancienne valeur (à remplacer):**
- Probablement: `https://desktop-bhhs068.tail1d9c54.ts.net`
- Ou: `http://localhost:3005`

**Environments:** Production, Preview, Development (tous cochés)

**Save**

---

### 2. NEXT_PUBLIC_API_URL

**Trouver la variable:**
- Dans la liste, cherche `NEXT_PUBLIC_API_URL`
- Clique sur les 3 points (...) à droite
- Clique sur "Edit"

**Nouvelle valeur:**
```
https://midi-charm-harvard-performed.trycloudflare.com/api
```

**Ancienne valeur (à remplacer):**
- Probablement: `https://desktop-bhhs068.tail1d9c54.ts.net/api`

**Environments:** Production, Preview, Development (tous cochés)

**Save**

---

### 3. NEXT_PUBLIC_SUPABASE_URL

**Vérifier:**
- Cherche `NEXT_PUBLIC_SUPABASE_URL`
- Si elle existe, vérifie qu'elle a la bonne valeur

**Valeur correcte:**
```
https://szgodrjglbpzkrksnroi.supabase.co
```

**Si elle n'existe pas:** Ajoute-la (Add)

**Save**

---

### 4. NEXT_PUBLIC_SUPABASE_ANON_KEY

**Vérifier:**
- Cherche `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Si elle existe, vérifie qu'elle a la bonne valeur

**Valeur correcte:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
```

**Si elle n'existe pas:** Ajoute-la (Add)

**Save**

---

## 📊 Résumé des Changements

| Variable | Ancienne Valeur | Nouvelle Valeur |
|----------|----------------|-----------------|
| `BACKEND_URL` | `desktop-bhhs068.tail1d9c54.ts.net` | `midi-charm-harvard-performed.trycloudflare.com` |
| `NEXT_PUBLIC_API_URL` | `desktop-bhhs068.tail1d9c54.ts.net/api` | `midi-charm-harvard-performed.trycloudflare.com/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | (vérifier) | `szgodrjglbpzkrksnroi.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (vérifier) | `eyJhbGc...` |

## ⚠️ IMPORTANT: Redéployer Après

Une fois TOUTES les variables modifiées:

1. **Va sur Deployments**:
   https://vercel.com/habibbelkacemimosta-7724s-projects/frontend/deployments

2. **Redéploie** (3 points → Redeploy)

3. **Attends 2-3 minutes**

4. **Teste l'application**

## 🧪 Vérification

Après le redéploiement, ouvre la console (F12) et tu devrais voir:

**✅ Succès:**
```
🌐 BACKEND_URL configured: https://midi-charm-harvard-performed.trycloudflare.com
✅ Frontend API: Received [nombre] suppliers from backend
📦 Clients loaded: [nombre]
📦 Articles loaded: [nombre]
```

**❌ Plus d'erreurs 500**

## 📝 Checklist

- [ ] BACKEND_URL modifié → Cloudflare
- [ ] NEXT_PUBLIC_API_URL modifié → Cloudflare
- [ ] NEXT_PUBLIC_SUPABASE_URL vérifié/ajouté
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY vérifié/ajouté
- [ ] Redéploiement lancé
- [ ] Attendre 2-3 minutes
- [ ] Tester l'application

---

**Dis-moi quand tu as modifié les variables et lancé le redéploiement !**
