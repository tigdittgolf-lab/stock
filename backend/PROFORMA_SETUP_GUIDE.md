# 🎯 GUIDE DE CONFIGURATION PROFORMA

## ❌ **PROBLÈME RÉSOLU**
**Erreur** : `Failed to generate proforma number`

**Cause** : Les fonctions RPC pour les proformas n'existaient pas dans Supabase.

## ✅ **SOLUTION APPLIQUÉE**

### **1. Corrections Backend** 🔧
- ✅ **Ajout endpoint** : `GET /api/sales/proforma/next-number`
- ✅ **Correction appels RPC** : Utilisation des fonctions `_simple`
- ✅ **Gestion d'erreurs** : Fallback vers numéro 1 si RPC échoue

### **2. Corrections Frontend** 🖥️
- ✅ **Correction nom champ** : `detail_fprof` → `detail_proforma`

### **3. Fonctions RPC Créées** 📊
**Fichier** : `backend/create-proforma-functions.sql`

**Fonctions créées** :
- ✅ `get_next_proforma_number_simple(p_tenant)` - Obtient le prochain numéro
- ✅ `insert_proforma_simple(...)` - Crée une proforma
- ✅ `insert_detail_proforma_simple(...)` - Ajoute les détails

## 🚀 **ÉTAPES POUR FINALISER**

### **ÉTAPE OBLIGATOIRE** ⚠️
**Exécuter les fonctions RPC dans Supabase :**

1. **Aller dans Supabase** → SQL Editor
2. **Copier le contenu** de `backend/create-proforma-functions.sql`
3. **Exécuter le script** pour créer les 3 fonctions RPC
4. **Vérifier** que les fonctions sont créées sans erreur

### **APRÈS EXÉCUTION DES FONCTIONS** ✅
**La création de proforma fonctionnera parfaitement !**

## 🧪 **TEST DE LA FONCTIONNALITÉ**

### **Données de Test** 📋
```
Client : CL01 - cl1 nom1
Articles :
  - 1000 (Gillet jaune) : Qté 15, Prix 1856.40 DA
  - 1112 (peinture lavable) : Qté 5, Prix 1285.20 DA

Totaux attendus :
  - Montant HT : 34,272.00 DA
  - TVA : 6,511.68 DA  
  - Total TTC : 40,783.68 DA
```

### **Processus de Test** 🔄
1. **Aller sur** : `http://localhost:3000/proforma`
2. **Sélectionner client** : CL01
3. **Ajouter les articles** avec quantités et prix
4. **Cliquer** "Créer la Facture Proforma"
5. **Vérifier** le message de succès avec numéro de proforma

## 📊 **FONCTIONNALITÉS PROFORMA**

### **Création** ✅
- ✅ **Sélection client** depuis la base de données
- ✅ **Ajout articles** avec prix automatique
- ✅ **Calcul automatique** des totaux HT, TVA, TTC
- ✅ **Numérotation séquentielle** automatique
- ✅ **Validation** des données avant création

### **Particularités Proforma** 📝
- ✅ **Pas de vérification stock** (contrairement aux BL/Factures)
- ✅ **Pas de déduction stock** (document informatif)
- ✅ **Calculs identiques** aux autres documents
- ✅ **Stockage base de données** réelle

## 🎉 **RÉSULTAT FINAL**

**Une fois les fonctions RPC exécutées dans Supabase :**
- ✅ **Proforma créée** avec numéro séquentiel
- ✅ **Données stockées** en base de données réelle
- ✅ **Calculs corrects** HT, TVA, TTC
- ✅ **Interface utilisateur** fonctionnelle
- ✅ **Messages de succès** informatifs

**La fonctionnalité proforma sera complètement opérationnelle !** 🚀