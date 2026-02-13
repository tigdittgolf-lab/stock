# 🔄 INSTRUCTIONS POUR REDÉMARRER LE BACKEND

## ⚠️ IMPORTANT

Le fichier `backend/src/services/databaseService.ts` a été modifié mais le backend utilise toujours l'ancien code en mémoire.

## 📝 ÉTAPES À SUIVRE

### 1. Arrêter le backend actuel

Dans le terminal où le backend tourne, appuyez sur `Ctrl+C` pour arrêter le processus.

### 2. Démarrer Tailscale Funnel (si nécessaire)

```bash
tailscale funnel --bg 3005
```

### 3. Redémarrer le backend

```bash
cd backend
bun run dev
```

OU si vous utilisez le script de démarrage:

```bash
cd backend
bun run src/index.ts
```

## ✅ VÉRIFICATION

Après le redémarrage, les logs devraient montrer:

```
🐬 MySQL: Executing query: SELECT * FROM `2099_bu02`.article ORDER BY narticle...
✅ MySQL: Query successful, X rows returned
```

Au lieu de:

```
🐬 MySQL: Executing query: SELECT * FROM article ORDER BY narticle...
❌ MySQL query failed: Aucune base n'a été sélectionnée
```

## 🔍 CE QUI A ÉTÉ CORRIGÉ

Dans `backend/src/services/databaseService.ts`, ligne ~1335:

**AVANT:**
```typescript
if (dbType === 'mysql') {
  sql = `SELECT * FROM article ORDER BY narticle`;  // ❌ Pas de schéma
}
```

**APRÈS:**
```typescript
if (dbType === 'mysql') {
  sql = `SELECT * FROM \`${tenant}\`.article ORDER BY narticle`;  // ✅ Avec schéma
}
```

Cette correction permet à MySQL de savoir dans quelle base de données chercher la table `article`.
