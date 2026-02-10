# ⚡ Démarrage Rapide - Synchronisation BDD

## 🎯 En 3 étapes

### 1️⃣ Installation (1 minute)

```bash
npm install
```

### 2️⃣ Configuration (2 minutes)

```bash
# Copier le fichier d'exemple
cp .env.example .env
```

Éditer `.env` avec vos informations Supabase/PostgreSQL :

```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=votre-mot-de-passe
```

**Où trouver ces informations ?**
- Supabase Dashboard → Settings → Database → Connection string
- Ou dans votre fichier de configuration existant

### 3️⃣ Test & Synchronisation (30 secondes)

```bash
# Tester la connexion
npm run test-connection

# Si OK, synchroniser
npm run sync-db

# Vérifier
npm run verify-sync
```

## ✅ C'est fait !

Vos fonctions et procédures sont maintenant synchronisées depuis `2025_bu01` vers toutes les autres bases.

---

## 📊 Résultat attendu

```
╔════════════════════════════════════════════════════════╗
║  Synchronisation des Fonctions et Procédures          ║
║  Source: 2025_bu01                                     ║
╚════════════════════════════════════════════════════════╝

🔌 Connexion à la base de données...
✅ Connecté

📊 3 schéma(s) cible(s) trouvé(s):
   - 2024_bu01
   - 2024_bu02
   - 2024_bu03

📥 EXTRACTION DES DÉFINITIONS
...

🚀 DÉPLOIEMENT VERS LES SCHÉMAS CIBLES
...

📊 RÉSUMÉ DE LA SYNCHRONISATION
   Total d'opérations: 24
   ✅ Réussies: 24
   ❌ Échouées: 0
   📈 Taux de réussite: 100.0%
```

---

## 🔧 Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run test-connection` | Tester la configuration |
| `npm run sync-db` | Synchroniser les bases |
| `npm run verify-sync` | Vérifier la synchro |
| `npm run rollback` | Annuler (⚠️ destructif) |

---

## ❓ Problèmes ?

### "Cannot find module 'pg'"
```bash
npm install
```

### "Missing .env file"
```bash
cp .env.example .env
# Puis éditez .env avec vos credentials
```

### "Connection refused"
- Vérifiez DB_HOST, DB_PORT, DB_USER, DB_PASSWORD dans `.env`
- Pour Supabase : utilisez `db.xxxxx.supabase.co` (pas l'URL API)

---

## 📚 Plus d'infos

- **Guide complet** : `README_SYNC.md`
- **Documentation détaillée** : `GUIDE_SYNCHRONISATION_BDD.md`
- **Personnalisation** : Éditez `sync-database-objects-pg.js`

---

## 🎉 Prêt à automatiser ?

Ajoutez à votre workflow :

```bash
# Avant chaque déploiement
npm run sync-db && npm run verify-sync
```

Ou planifiez avec cron/Task Scheduler (voir `GUIDE_SYNCHRONISATION_BDD.md`)
