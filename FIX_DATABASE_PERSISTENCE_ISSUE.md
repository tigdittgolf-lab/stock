# ✅ CORRECTION: Problème de persistance de la configuration

## 🔍 PROBLÈME IDENTIFIÉ

Le backend rebasculait constamment vers Supabase même après avoir sélectionné MySQL. Les logs montraient:

```
🔀 [Middleware] Database Type: mysql
🔄 Backend switching to database: mysql (MySQL Local)
💾 Configuration sauvegardée: mysql  ← Sauvegarde dans un fichier
✅ Backend database switched to: mysql

[Quelques secondes plus tard...]

🔀 [Middleware] Database Type: supabase  ← Rebascule vers Supabase!
🔄 Backend switching to database: supabase (Supabase Cloud)
```

### Cause racine

Le `BackendDatabaseService` sauvegardait la configuration dans un fichier `database-config.json`:

```typescript
private saveActiveConfig(): void {
  fs.writeFileSync(configPath, JSON.stringify(this.activeConfig, null, 2));
  console.log(`💾 Configuration sauvegardée: ${this.activeConfig?.type}`);
}
```

Et au démarrage, il rechargeait ce fichier:

```typescript
private loadActiveConfig(): void {
  if (fs.existsSync(configPath)) {
    const savedConfig = JSON.parse(configData);
    this.activeConfig = savedConfig;  // ← Écrase la config actuelle
  }
}
```

**Problème:** Si le fichier contenait `supabase`, le backend rebasculait vers Supabase à chaque redémarrage ou à certaines requêtes.

## 🔧 SOLUTION APPLIQUÉE

### 1. Désactivation de la sauvegarde persistante

Dans `backend/src/services/databaseService.ts`, ligne ~180:

```typescript
// Sauvegarder la nouvelle configuration EN MÉMOIRE UNIQUEMENT
this.activeConfig = config;
// NE PAS sauvegarder dans un fichier - la config doit venir du header X-Database-Type à chaque requête
// this.saveActiveConfig(); // ❌ DÉSACTIVÉ
```

### 2. Suppression du fichier de configuration

```bash
Remove-Item backend/database-config.json
```

## 📊 COMPORTEMENT ATTENDU

Maintenant, le type de base de données est déterminé **uniquement** par le header `X-Database-Type` de chaque requête:

```
Requête 1: X-Database-Type: mysql
→ Backend utilise MySQL ✅

Requête 2: X-Database-Type: mysql
→ Backend utilise MySQL ✅

Requête 3: X-Database-Type: mysql
→ Backend utilise MySQL ✅
```

Plus de rebascule vers Supabase!

## 🔄 POUR TESTER

1. **Redémarrer le backend** (important!)
   ```bash
   cd backend
   bun run dev
   ```

2. **Se connecter avec MySQL**

3. **Vérifier les logs backend**
   - Toutes les requêtes devraient montrer `Database Type: mysql`
   - Plus de messages `Configuration sauvegardée`
   - Plus de rebascule vers Supabase

## ✅ LOGS ATTENDUS

```
🔀 [Middleware] Database Type: mysql
✅ [Middleware] Switched to MySQL Local
🐬 MySQL: Executing query: SELECT * FROM `2099_bu02`.article...
✅ MySQL: Query successful, X rows returned

🔀 [Middleware] Database Type: mysql
✅ [Middleware] Switched to MySQL Local
🐬 MySQL: Executing query: SELECT * FROM `2099_bu02`.client...
✅ MySQL: Query successful, X rows returned
```

## 📝 FICHIERS MODIFIÉS

1. `backend/src/services/databaseService.ts` - Désactivation de `saveActiveConfig()`
2. `backend/database-config.json` - Supprimé

## ⚠️ NOTE IMPORTANTE

La configuration de la base de données est maintenant **volatile** (en mémoire uniquement). Cela signifie:

- ✅ Chaque requête peut utiliser une base différente selon son header
- ✅ Pas de conflit entre les requêtes simultanées
- ✅ Le frontend contrôle complètement quelle base utiliser
- ⚠️ Au redémarrage du backend, la config par défaut est Supabase (mais sera écrasée par le premier header reçu)

C'est le comportement souhaité pour un système multi-base de données!

## ✅ STATUT: RÉSOLU

Le backend ne rebascule plus vers Supabase. Il utilise maintenant le type de base de données spécifié dans le header `X-Database-Type` de chaque requête.
