# 🔑 GUIDE DE CONNEXION - Système de Gestion de Stock

## 👤 COMPTES UTILISATEURS CRÉÉS

### 👨‍💼 **ADMINISTRATEUR**
- **Email** : `admin@stock.dz`
- **Mot de passe** : `admin123`
- **Rôle** : Administrateur (accès complet)

### 👤 **UTILISATEUR TEST**
- **Email** : `test@stock.dz`
- **Mot de passe** : `test123`
- **Rôle** : Utilisateur standard

## 🚀 ÉTAPES DE CONNEXION

### 1. **Accéder à l'application**
```
http://localhost:3000/login
```

### 2. **Se connecter**
- Entrez l'email et le mot de passe
- Cliquez sur "Se connecter"

### 3. **Sélectionner le tenant**
Après connexion, vous serez redirigé vers la sélection de tenant :
- **Business Unit** : Choisissez `bu01` ou `bu02`
- **Année** : Choisissez `2025` (exercice actuel)
- Cliquez sur "Continuer"

### 4. **Accéder aux fonctionnalités**
Une fois le tenant sélectionné, vous aurez accès à :
- 📦 Gestion des articles
- 👥 Gestion des clients
- 🏭 Gestion des fournisseurs
- 📋 Bons de livraison
- 🧾 Factures
- 📊 Proformas
- 📈 Rapports

## 🏢 TENANTS DISPONIBLES

### **2025_bu01** (Recommandé)
- Contient vos vraies données d'entreprise
- **Entreprise** : ETS BENAMAR BOUZID MENOUAR
- **Données** : Articles, clients, fournisseurs d'exemple

### **2025_bu02**
- Tenant secondaire
- **Entreprise** : DISTRIB FOOD SPA (données d'exemple)
- **Données** : Structure identique, données séparées

## 📄 GÉNÉRATION DE PDFs

Une fois connecté et tenant sélectionné :

1. **Aller aux bons de livraison** : `/delivery-notes/list`
2. **Créer ou consulter un BL**
3. **Cliquer sur les boutons PDF** :
   - 📄 **BL Complet** : Format A4 complet
   - 📄 **BL Réduit** : Format compact
   - 🎫 **Ticket** : Format ticket de caisse (80mm)

Les PDFs afficheront automatiquement les informations de votre entreprise selon le tenant sélectionné.

## 🔧 DÉPANNAGE

### ❌ **"Email ou mot de passe incorrect"**
- Vérifiez que vous utilisez les bons identifiants
- Assurez-vous que les serveurs sont démarrés

### ❌ **"Erreur de connexion"**
- Vérifiez que le backend tourne sur le port 3005
- Vérifiez que le frontend tourne sur le port 3000

### ❌ **"Tenant non trouvé"**
- Sélectionnez `2025_bu01` (tenant principal)
- Si le problème persiste, exécutez le script de déploiement

## 🚀 DÉMARRAGE RAPIDE

```bash
# Terminal 1 - Backend
cd backend
bun run index.ts

# Terminal 2 - Frontend  
cd frontend
bun run dev

# Navigateur
# Ouvrir: http://localhost:3000/login
# Email: admin@stock.dz
# Password: admin123
```

## 📞 SUPPORT

Si vous rencontrez des problèmes :
1. Vérifiez que les deux serveurs sont démarrés
2. Consultez les logs dans les terminaux
3. Utilisez les identifiants exacts fournis ci-dessus
4. Sélectionnez le tenant `2025_bu01` pour vos vraies données

**Bonne utilisation de votre système de gestion de stock !** 🎯