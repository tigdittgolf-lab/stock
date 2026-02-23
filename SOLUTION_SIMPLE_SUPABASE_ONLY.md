# ✅ Solution Simple - Supabase Uniquement (RECOMMANDÉ)

## Pourquoi Cette Solution?

Vous avez déjà des routes API Next.js qui appellent Supabase directement.
Pas besoin de ngrok, pas besoin de backend séparé en production!

## Architecture Actuelle

```
[Frontend Vercel]
    ↓
[Routes API Next.js] (/api/purchases, /api/sales)
    ↓
[Supabase] ❌ Variables manquantes!
```

## Solution: Ajouter les Variables Supabase dans Vercel

### Étape Unique: Configurer Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez **st-article-1**
3. **Settings** → **Environment Variables**
4. Ajoutez ces 4 variables pour **Production, Preview, Development**:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://szgodrjglbpzkrksnroi.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU
Environments: ✓ Production ✓ Preview ✓ Development

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg
Environments: ✓ Production ✓ Preview ✓ Development

Name: SUPABASE_URL
Value: https://szgodrjglbpzkrksnroi.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

5. Cliquez sur **Save**
6. Attendez le redéploiement automatique (2-3 minutes)
7. Testez vos pages!

## C'est Tout! 🎉

Pas besoin de:
- ❌ Ngrok
- ❌ Backend séparé en production
- ❌ Tunnel
- ❌ Configuration complexe

## Vérification

Testez ces URLs après le redéploiement:
- ✅ BL de Vente: `https://votre-app.vercel.app/delivery-notes/list`
- ✅ BL d'Achat: `https://votre-app.vercel.app/purchases/delivery-notes/list`

## Comment Ça Marche?

Vos routes API Next.js sont déjà configurées pour appeler Supabase:

```typescript
// frontend/app/api/purchases/delivery-notes/route.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  const { data, error } = await supabase.rpc('get_purchase_delivery_notes', {
    p_tenant: tenant
  });
  // ...
}
```

En ajoutant les variables d'environnement dans Vercel, ces routes fonctionneront automatiquement!

## Architecture Finale

```
[Utilisateur]
    ↓
[Vercel Frontend]
    ↓
[Routes API Next.js] (/api/purchases, /api/sales)
    ↓
[Supabase] ✅ Avec credentials!
```

## Développement Local

En local, vous pouvez continuer à utiliser:
- Votre backend local (localhost:3005)
- Ou les routes API Next.js qui appellent Supabase

Les deux fonctionneront!

## 🆘 Si Ça Ne Marche Pas

### Vérifier les Variables
```powershell
vercel env ls
```

Vous devriez voir les 4 variables listées.

### Vérifier les Logs
Dans Vercel Dashboard:
1. **Deployments** → Dernier déploiement
2. **Functions** → Logs
3. Cherchez les erreurs Supabase

### Erreurs Communes

**"SUPABASE_URL is not defined"**
- La variable n'est pas configurée dans Vercel
- Ou le redéploiement n'est pas terminé

**"RPC function not found"**
- La fonction RPC n'existe pas dans Supabase
- Vérifiez que vous avez exécuté les scripts SQL

**"Invalid API key"**
- La clé Supabase est incorrecte
- Vérifiez que vous avez copié la bonne clé

## 📝 Checklist

- [ ] Variables Supabase ajoutées dans Vercel
- [ ] Redéploiement terminé (2-3 minutes)
- [ ] BL de vente fonctionnent
- [ ] BL d'achat fonctionnent
- [ ] Pas d'erreur 500 dans la console

## 💡 Bonus: Supprimer les Références au Backend

Si vous voulez nettoyer le code, vous pouvez supprimer les références à `BACKEND_URL` et `NEXT_PUBLIC_API_URL` puisque vous n'en avez plus besoin en production.

Mais ce n'est pas obligatoire - ça ne causera pas de problème.
