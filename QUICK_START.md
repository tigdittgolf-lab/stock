# 🚀 Guide de Démarrage Rapide

## ✅ État Actuel

Votre application est **opérationnelle** et prête à l'emploi!

### Serveurs Actifs
- **Backend API**: http://localhost:3005 ✅
- **Frontend Web**: http://localhost:3000 ✅

### Données Disponibles
- **25 articles** en stock
- **15 alertes** de stock faible
- **Clients et fournisseurs** configurés

## 🎯 Accès Rapide

### Interface Web
Ouvrez votre navigateur et allez sur:
```
http://localhost:3000
```

### Navigation
- **Tableau de Bord**: Vue d'ensemble des statistiques
- **Articles**: Gestion complète des produits
- **Clients**: Gestion des clients
- **Fournisseurs**: Gestion des fournisseurs
- **Ventes**: Factures et bons de livraison
- **Achats**: Factures et BL d'achat
- **Stock**: Suivi du stock et alertes
- **Finances**: Suivi financier

## 📋 Fonctionnalités Principales

### 1. Gestion des Articles
- ✅ Ajouter un nouvel article
- ✅ Modifier un article existant
- ✅ Supprimer un article
- ✅ Voir le stock disponible
- ✅ Alertes de stock faible

**Comment faire:**
1. Cliquer sur "Articles" dans le menu
2. Cliquer sur "Ajouter un Article"
3. Remplir le formulaire
4. Le prix de vente est calculé automatiquement

### 2. Créer une Facture
- ✅ Sélectionner un client
- ✅ Ajouter des articles
- ✅ Calcul automatique des totaux
- ✅ Vérification du stock

**Comment faire:**
1. Aller sur http://localhost:3000/invoices
2. Sélectionner un client
3. Ajouter des articles ligne par ligne
4. Cliquer sur "Créer la Facture"

### 3. Consulter le Stock
- ✅ Vue d'ensemble du stock
- ✅ Valeur totale: 201,529,901.2 DA
- ✅ 15 articles en stock faible

**Comment faire:**
1. Cliquer sur "Stock" dans le menu
2. Voir les statistiques et alertes

## 🔧 Commandes Utiles

### Arrêter les Serveurs
Si vous devez arrêter l'application:
```bash
# Dans le terminal où tourne le backend
Ctrl + C

# Dans le terminal où tourne le frontend
Ctrl + C
```

### Redémarrer les Serveurs
```bash
# Backend
cd backend
bun run index.ts

# Frontend
cd frontend
bun run dev
```

### Ou utiliser le script automatique (Windows)
Double-cliquer sur: `start-dev.bat`

## 📊 API Endpoints

Si vous voulez tester l'API directement:

### Articles
```bash
# Liste des articles
curl http://localhost:3005/api/articles

# Détail d'un article
curl http://localhost:3005/api/articles/12
```

### Stock
```bash
# Résumé du stock
curl http://localhost:3005/api/stock/summary

# Alertes stock faible
curl http://localhost:3005/api/stock/low-stock
```

### Ventes
```bash
# Liste des factures
curl http://localhost:3005/api/sales/invoices

# Liste des BL
curl http://localhost:3005/api/sales/delivery-notes
```

## 🐛 Résolution de Problèmes

### Le frontend ne charge pas
1. Vérifier que le backend tourne sur le port 3005
2. Vérifier que le frontend tourne sur le port 3000
3. Rafraîchir la page (F5)

### Erreur "Failed to fetch"
1. Vérifier que le backend est démarré
2. Vérifier l'URL de l'API dans `.env.local`
3. Vérifier les logs du backend

### Port déjà utilisé
```bash
# Windows - Trouver le processus
netstat -ano | findstr :3000
netstat -ano | findstr :3005

# Tuer le processus
taskkill /PID <PID> /F
```

## 📚 Documentation Complète

Pour plus d'informations, consultez:
- `README.md` - Documentation complète
- `MIGRATION_PROGRESS.md` - État de la migration
- `COMMANDS.md` - Toutes les commandes
- `FIXES.md` - Corrections appliquées

## 💡 Astuces

### Raccourcis Clavier
- **F5**: Rafraîchir la page
- **F12**: Ouvrir les DevTools
- **Ctrl+C**: Arrêter un serveur

### Développement
- Les serveurs se rechargent automatiquement quand vous modifiez le code
- Les logs s'affichent dans les terminaux
- Utilisez les DevTools pour déboguer le frontend

### Données de Test
Vous avez déjà:
- 25 articles en base
- Des clients configurés
- Des fournisseurs configurés

## 🎓 Prochaines Étapes

1. **Explorer l'interface**
   - Naviguer dans les différentes sections
   - Créer un article de test
   - Créer une facture de test

2. **Personnaliser**
   - Ajouter vos propres articles
   - Configurer vos clients
   - Configurer vos fournisseurs

3. **Utiliser**
   - Créer des factures réelles
   - Suivre votre stock
   - Générer des rapports

## 📞 Besoin d'Aide?

1. Consultez les logs dans les terminaux
2. Vérifiez la documentation
3. Testez les endpoints API avec curl
4. Vérifiez les fichiers `.env` et `.env.local`

## 🎉 Félicitations!

Votre système de gestion de stock est opérationnel!

**Bon travail!** 🚀

---

**Dernière mise à jour:** 9 décembre 2025
**Version:** 1.0.0
**Status:** ✅ Opérationnel
