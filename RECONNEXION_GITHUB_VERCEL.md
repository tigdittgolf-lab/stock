# 🔗 Reconnexion GitHub ↔ Vercel

## 🎯 Problème Identifié

**GitHub**: https://github.com/tigdittgolf-lab/stock
- ✅ Code à jour (commit `32a4bc6`)
- ✅ Tous les changements poussés

**Vercel**: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1
- ❌ Dernier déploiement: Il y a 50+ minutes
- ❌ Ne détecte pas les nouveaux commits
- ❌ Pas de synchronisation automatique

## 🔧 Solution: Reconnecter GitHub et Vercel

### Méthode 1: Vérifier et Reconnecter dans Vercel

1. **Va sur la page Git Settings** (déjà ouverte):
   https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/settings/git

2. **Vérifie la connexion**:
   - Tu devrais voir: "Connected Git Repository"
   - Repository: `tigdittgolf-lab/stock`
   - Branch: `main`

3. **Si déconnecté ou problème**:
   - Clique sur "Disconnect" (si connecté)
   - Puis clique sur "Connect Git Repository"
   - Sélectionne GitHub
   - Choisis le repository: `tigdittgolf-lab/stock`
   - Sélectionne la branche: `main`
   - Confirme

4. **Après reconnexion**:
   - Vercel va automatiquement déployer le dernier commit
   - Attends 2-3 minutes

### Méthode 2: Vérifier les Webhooks GitHub

1. **Va sur la page Webhooks GitHub** (déjà ouverte):
   https://github.com/tigdittgolf-lab/stock/settings/hooks

2. **Cherche le webhook Vercel**:
   - URL doit contenir: `vercel.com`
   - Status: ✓ (coche verte)

3. **Si webhook absent ou en erreur**:
   - Supprime-le (si en erreur)
   - Reconnecte le projet dans Vercel (Méthode 1)
   - Vercel recréera automatiquement le webhook

4. **Si webhook présent mais ne fonctionne pas**:
   - Clique sur le webhook
   - Clique sur "Recent Deliveries"
   - Vérifie les erreurs
   - Clique sur "Redeliver" pour tester

### Méthode 3: Forcer le Déploiement Manuel (Si rien ne marche)

1. **Va sur Deployments**:
   https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/deployments

2. **Clique sur "Create Deployment"** (bouton en haut à droite)

3. **Sélectionne**:
   - Branch: `main`
   - Commit: `32a4bc6` (le plus récent)

4. **Clique sur "Deploy"**

## 📊 Ce qui Devrait se Passer

### Après Reconnexion
1. Vercel détecte le dernier commit (`32a4bc6`)
2. Démarre un nouveau déploiement automatiquement
3. Build et déploie en 2-3 minutes
4. L'application sera à jour avec toutes les corrections Cloudflare

### Commits à Déployer
```
32a4bc6 - fix: Replace Tailscale with Cloudflare in all API routes
1d6984b - deploy: Update Cloudflare tunnel URL - DEPLOY NOW
b849f31 - deploy: Force redeploy at 2026-02-21_14-34-16
56fa987 - chore: Force Vercel redeploy with Cloudflare tunnel
5bf2aa0 - fix: Remplacer Tailscale par Cloudflare tunnel
```

## 🧪 Vérifier que ça Fonctionne

### Test 1: Nouveau Commit
Après reconnexion, teste avec un commit vide:
```bash
git commit --allow-empty -m "test: Verify GitHub-Vercel sync"
git push origin main
```

Vercel devrait déployer automatiquement en 1-2 minutes.

### Test 2: Webhook GitHub
1. Va sur: https://github.com/tigdittgolf-lab/stock/settings/hooks
2. Clique sur le webhook Vercel
3. Clique sur "Recent Deliveries"
4. Tu devrais voir les push récents avec status 200

## ⚠️ Problèmes Courants

### Webhook GitHub Manquant
**Cause**: Vercel n'a pas les permissions GitHub
**Solution**: 
1. Va sur: https://github.com/settings/installations
2. Trouve "Vercel"
3. Clique sur "Configure"
4. Vérifie que `tigdittgolf-lab/stock` est dans la liste
5. Si non, ajoute-le

### Webhook en Erreur
**Cause**: URL Vercel invalide ou permissions
**Solution**: Supprime et reconnecte dans Vercel

### Déploiements Bloqués
**Cause**: Build précédent en erreur
**Solution**: Annule les déploiements en cours, puis redéploie

## 🔗 Liens Rapides

- **Vercel Git Settings**: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/settings/git
- **GitHub Webhooks**: https://github.com/tigdittgolf-lab/stock/settings/hooks
- **Vercel Deployments**: https://vercel.com/habibbelkacemimosta-7724s-projects/st-article-1/deployments
- **GitHub Commits**: https://github.com/tigdittgolf-lab/stock/commits/main
- **GitHub Installations**: https://github.com/settings/installations

## 📝 Checklist

- [ ] Vérifier connexion Git dans Vercel
- [ ] Vérifier webhook dans GitHub
- [ ] Reconnecter si nécessaire
- [ ] Attendre le déploiement automatique (2-3 min)
- [ ] OU forcer le déploiement manuel
- [ ] Vérifier que le commit `32a4bc6` est déployé
- [ ] Tester l'application

---

**Date**: 21 février 2026, 15:05 UTC
**Action requise**: Reconnecter GitHub et Vercel
**Temps estimé**: 2-5 minutes
