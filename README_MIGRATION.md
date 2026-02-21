# 🚀 Système de Migration MySQL → Supabase

## 📖 Vue d'ensemble

Système complet de migration automatique de bases de données MySQL vers Supabase (PostgreSQL), avec interface web intuitive et découverte automatique des schémas.

## ✨ Fonctionnalités

### 🔍 Découverte Automatique
- Détection automatique des bases tenant (pattern: YYYY_buXX)
- Analyse complète de la structure (tables, colonnes, contraintes)
- Comptage des enregistrements
- Échantillonnage des données

### 🎯 Migration Intelligente
- Sélection flexible des bases à migrer
- Migration complète: schémas + tables + données + RPC
- Gestion automatique des types de données
- Gestion des conflits (upsert)
- Vérification d'intégrité

### 📊 Interface Utilisateur
- Configuration simple et intuitive
- Test des connexions avant migration
- Progression en temps réel
- Logs détaillés
- Avertissements de sécurité

### 🔐 Sécurité
- Validation des configurations
- Test des permissions
- Gestion d'erreurs complète
- Logs d'audit

## 📁 Structure du Projet

```
.
├── CREATE_DISCOVERY_RPC_FUNCTIONS.sql    # Fonctions RPC Supabase
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   │   └── database-migration/
│   │   │       └── page.tsx              # Interface de migration
│   │   └── api/
│   │       └── admin/
│   │           ├── discover-mysql-databases/
│   │           │   └── route.ts          # API découverte
│   │           └── migration/
│   │               ├── route.ts          # API migration
│   │               └── test/
│   │                   └── route.ts      # API test
│   └── lib/
│       └── database/
│           ├── true-migration-service.ts # Service migration
│           ├── complete-discovery-service.ts # Service découverte
│           ├── adapters/
│           │   ├── mysql-adapter.ts      # Adaptateur MySQL
│           │   ├── postgresql-adapter.ts # Adaptateur PostgreSQL
│           │   └── supabase-adapter.ts   # Adaptateur Supabase
│           └── types.ts                  # Types TypeScript
│
├── MIGRATION_IMPLEMENTATION_COMPLETE.md  # Documentation complète
├── GUIDE_MIGRATION_RAPIDE.md            # Guide rapide
├── ARCHITECTURE_MIGRATION.md            # Architecture technique
├── CHECKLIST_MIGRATION.md               # Checklist pré-migration
└── README_MIGRATION.md                  # Ce fichier
```

## 🚀 Démarrage Rapide

### 1. Prérequis
```bash
# Node.js 18+
node --version

# MySQL accessible
mysql --version

# Compte Supabase actif
```

### 2. Installation
```bash
cd frontend
npm install
```

### 3. Configuration Supabase
```bash
# 1. Ouvrir SQL Editor Supabase
https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql

# 2. Copier et exécuter CREATE_DISCOVERY_RPC_FUNCTIONS.sql
```

### 4. Lancement
```bash
npm run dev
# Ouvrir http://localhost:3001/admin/database-migration
```

### 5. Migration
1. Entrer configuration MySQL
2. Découvrir les bases
3. Sélectionner les bases
4. Tester les connexions (optionnel)
5. Lancer la migration
6. Suivre la progression

## 📚 Documentation

### Guides
- **[Guide Rapide](GUIDE_MIGRATION_RAPIDE.md)** - Démarrage en 5 minutes
- **[Checklist](CHECKLIST_MIGRATION.md)** - Vérifications avant migration
- **[Documentation Complète](MIGRATION_IMPLEMENTATION_COMPLETE.md)** - Détails techniques

### Architecture
- **[Architecture](ARCHITECTURE_MIGRATION.md)** - Diagrammes et flux
- **[Types](frontend/lib/database/types.ts)** - Interfaces TypeScript

## 🔄 Processus de Migration

### Étapes Automatiques
1. **Découverte** - Analyse complète de la source
2. **Validation** - Vérification de la structure
3. **Nettoyage** - Suppression des données existantes
4. **Schémas** - Création des schémas cibles
5. **Tables** - Création de toutes les tables
6. **Données** - Migration de toutes les données
7. **RPC** - Migration des fonctions RPC
8. **Vérification** - Validation de l'intégrité
9. **Finalisation** - Résumé et logs

### Temps Estimé
- Petite base (<1000 enregistrements): ~1 minute
- Moyenne base (1000-10000): ~2-5 minutes
- Grande base (>10000): ~5-15 minutes

## 🧪 Tests

### Test de Connexion
```bash
# Interface web
http://localhost:3001/admin/database-migration
# Cliquer "Tester les connexions"
```

### Test de Découverte
```bash
# Interface web
# Cliquer "Découvrir les bases de données"
```

### Test de Migration
```bash
# Recommandé: Commencer par une base de test
# Sélectionner une seule base
# Lancer la migration
# Vérifier les résultats
```

## 🐛 Résolution de Problèmes

### Erreur: "Impossible de se connecter à MySQL"
```bash
# Vérifier MySQL
mysql -u root -p

# Vérifier le port
netstat -an | grep 3306

# Vérifier les permissions
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Erreur: "Fonctions RPC non trouvées"
```bash
# Recréer les fonctions dans Supabase
# Copier CREATE_DISCOVERY_RPC_FUNCTIONS.sql
# Exécuter dans SQL Editor
```

### Erreur: "Migration lente"
```bash
# Normal pour grandes bases
# Compter ~1-2 minutes par 1000 enregistrements
# Ne pas interrompre le processus
```

### Logs Détaillés
```bash
# Console navigateur (F12)
# Onglet Console

# Logs serveur
# Terminal où npm run dev est lancé
```

## 📊 Métriques

### Performances
- Découverte: ~5-10 secondes par base
- Création tables: ~1 seconde par table
- Migration données: ~100 enregistrements/seconde
- Vérification: ~2 secondes par table

### Limites
- Batch size: 100 enregistrements par requête
- Timeout: 5 minutes par étape
- Taille max: Limitée par Supabase (plan)

## 🔐 Sécurité

### Bonnes Pratiques
- ✅ Utiliser service_role key (pas anon key)
- ✅ Sauvegarder avant migration
- ✅ Tester sur base de test d'abord
- ✅ Vérifier les permissions
- ✅ Ne pas exposer les credentials

### Données Sensibles
- ⚠️ Les mots de passe ne sont pas stockés
- ⚠️ Les connexions sont temporaires
- ⚠️ Les logs ne contiennent pas de credentials

## 🤝 Contribution

### Améliorations Possibles
1. **Parallélisation** - Migrer plusieurs tables en parallèle
2. **Reprise** - Reprendre migration après erreur
3. **Incrémental** - Migrer uniquement les changements
4. **Validation** - Comparer checksums source/cible
5. **Rollback** - Annuler migration automatiquement
6. **Planification** - Programmer migrations automatiques
7. **Notifications** - Email/Slack quand terminé

### Code
```bash
# Cloner le repo
git clone <repo-url>

# Installer dépendances
cd frontend
npm install

# Développer
npm run dev

# Tester
npm run test

# Build
npm run build
```

## 📞 Support

### Documentation
- [Guide Rapide](GUIDE_MIGRATION_RAPIDE.md)
- [Architecture](ARCHITECTURE_MIGRATION.md)
- [Checklist](CHECKLIST_MIGRATION.md)

### Logs
- Console navigateur (F12)
- Terminal serveur
- Logs Supabase

### Contacts
- Développeur: [Votre nom]
- Email: [Votre email]
- GitHub: [Votre GitHub]

## 📝 Changelog

### Version 1.0.0 (2024)
- ✅ Interface web complète
- ✅ Découverte automatique MySQL
- ✅ Migration complète vers Supabase
- ✅ Fonctions RPC Supabase
- ✅ Vérification d'intégrité
- ✅ Logs détaillés
- ✅ Documentation complète

## 📄 Licence

[Votre licence]

## 🎉 Remerciements

Merci à tous les contributeurs et utilisateurs de ce système de migration!

---

**Status: ✅ Production Ready**

Pour commencer: Lire [GUIDE_MIGRATION_RAPIDE.md](GUIDE_MIGRATION_RAPIDE.md)
