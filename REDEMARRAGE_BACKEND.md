# 🔄 Comment redémarrer le backend

## Le problème
Après avoir modifié le code backend, les changements ne sont pas pris en compte tant que le serveur n'est pas redémarré.

## Solution rapide

### Option 1: Utiliser le script PowerShell
```powershell
.\restart-backend.ps1
```

### Option 2: Manuellement
1. Ouvrir un terminal dans le dossier `backend`
2. Arrêter le serveur actuel (Ctrl+C si il tourne)
3. Lancer: `bun run dev`

### Option 3: Avec tsx (alternative)
```bash
cd backend
npx tsx index.ts
```

## Vérification
Une fois redémarré, vous devriez voir:
```
✅ Server running on port 3005
🔗 Database connected
```

## Note importante
Les modifications dans `backend/src/routes/purchases.ts` nécessitent un redémarrage pour être prises en compte.
