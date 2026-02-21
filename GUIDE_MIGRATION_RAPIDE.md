# 🚀 Guide Rapide - Migration MySQL → Supabase

## ⚡ Démarrage en 5 minutes

### 1️⃣ Créer les fonctions RPC dans Supabase (1 minute)

```bash
# Ouvrir dans votre navigateur:
https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql
```

1. Copier tout le contenu de `CREATE_DISCOVERY_RPC_FUNCTIONS.sql`
2. Coller dans l'éditeur SQL Supabase
3. Cliquer sur "Run" (▶️)
4. Vérifier: "Success. No rows returned"

✅ Les 5 fonctions RPC sont maintenant créées!

### 2️⃣ Lancer l'application (30 secondes)

```bash
cd frontend
npm run dev
```

Attendre le message:
```
✓ Ready in 2.5s
○ Local: http://localhost:3001
```

### 3️⃣ Accéder à l'interface de migration (10 secondes)

Ouvrir dans votre navigateur:
```
http://localhost:3001/admin/database-migration
```

### 4️⃣ Configurer MySQL (1 minute)

Remplir les champs:
- **Host**: `localhost` (ou IP de votre serveur MySQL)
- **Port**: `3306`
- **Utilisateur**: `root` (ou votre utilisateur MySQL)
- **Mot de passe**: Votre mot de passe MySQL

### 5️⃣ Découvrir les bases (30 secondes)

1. Cliquer sur **"🔍 Découvrir les bases de données"**
2. Attendre quelques secondes
3. Voir la liste des bases tenant (YYYY_buXX)

### 6️⃣ Tester les connexions (optionnel, 10 secondes)

1. Cliquer sur **"🧪 Tester les connexions"**
2. Vérifier que les deux connexions sont OK
3. Si erreur, vérifier vos paramètres

### 7️⃣ Sélectionner et migrer (2-5 minutes)

1. **Cocher** les bases à migrer (ou laisser toutes cochées)
2. Lire l'avertissement ⚠️
3. Cliquer sur **"▶️ Migrer X base(s)"**
4. **NE PAS FERMER** la page pendant la migration
5. Suivre la progression en temps réel

## 📊 Exemple de progression

```
🚀 Démarrage de la migration...
📊 Migration de 3 base(s) sélectionnée(s)
📤 Source: MySQL localhost:3306
📥 Cible: Supabase https://szgodrjglbpzkrksnroi.supabase.co

✅ Initialisation: Connexions établies
✅ Découverte: Découverte COMPLÈTE de toutes les tables réelles...
✅ Validation: Validation de 45 tables découvertes...
✅ Nettoyage: Nettoyage complet de la base cible...
✅ Schémas: Création des schémas cibles...
✅ Tables: Création de 45 tables réelles...
✅ Données: Migration de toutes les données réelles...
✅ Fonctions RPC: Migration des fonctions RPC vers la base locale...
✅ Vérification: Vérification complète de la migration...
✅ Terminé: Migration VRAIE terminée: 45 tables + RPC migrées!

📊 RÉSUMÉ:
  • Étapes: 9
  • Schéma: Oui
  • Données: Oui
```

## ⚠️ Points importants

### Avant de migrer
- ✅ Sauvegarder vos données Supabase existantes (si importantes)
- ✅ Vérifier que MySQL est accessible
- ✅ Vérifier que vous avez les bonnes permissions
- ✅ Tester les connexions avant de migrer

### Pendant la migration
- ❌ **NE PAS** fermer la page
- ❌ **NE PAS** rafraîchir la page
- ❌ **NE PAS** arrêter le serveur
- ✅ Suivre les logs en temps réel
- ✅ Attendre le message "Migration terminée"

### Après la migration
- ✅ Vérifier les logs pour erreurs éventuelles
- ✅ Tester quelques requêtes dans Supabase
- ✅ Vérifier le nombre d'enregistrements
- ✅ Tester l'application avec les nouvelles données

## 🐛 Résolution de problèmes

### Erreur: "Impossible de se connecter à MySQL"
```bash
# Vérifier que MySQL est démarré
mysql -u root -p

# Vérifier le port
netstat -an | grep 3306

# Vérifier les permissions
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
```

### Erreur: "Impossible de se connecter à Supabase"
- Vérifier l'URL Supabase
- Vérifier la clé API (service_role)
- Vérifier votre connexion internet

### Erreur: "Fonctions RPC non trouvées"
- Retourner à l'étape 1
- Recréer les fonctions RPC dans Supabase
- Vérifier qu'elles sont bien créées

### Migration lente
- Normal pour grandes bases (>10 000 enregistrements)
- Compter ~1-2 minutes par base
- Ne pas interrompre le processus

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifier les logs dans la console du navigateur (F12)
2. Vérifier les logs du serveur Node.js
3. Lire `MIGRATION_IMPLEMENTATION_COMPLETE.md` pour plus de détails

## 🎉 C'est tout!

Votre migration est maintenant complète. Les données MySQL sont dans Supabase et prêtes à être utilisées!

**Temps total estimé: 5-10 minutes** (selon le volume de données)
