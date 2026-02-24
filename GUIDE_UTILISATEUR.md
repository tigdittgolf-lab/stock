# Guide Utilisateur - Application Stock Management

## 🎯 Vue d'Ensemble

Application de gestion de stock multi-tenant avec support MySQL et Supabase.

## 📱 Interface Principale

### 1. Page de Connexion

```
┌─────────────────────────────────────┐
│     STOCK MANAGEMENT LOGIN          │
├─────────────────────────────────────┤
│                                     │
│  Username: [____________]           │
│  Password: [____________]           │
│                                     │
│  Tenant:   [2025_bu01 ▼]           │
│  Database: [MySQL ▼]                │
│                                     │
│         [Se Connecter]              │
│                                     │
└─────────────────────────────────────┘
```

**Actions:**
- Entrer username et password
- Sélectionner le tenant (unité commerciale)
- Choisir la base de données (MySQL ou Supabase)
- Cliquer "Se Connecter"

### 2. Tableau de Bord

```
┌────────────────────────────────────────────────────┐
│ 📊 Tableau de Bord          [2025_bu01] [MySQL ▼] │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ CA Jour  │  │ BL Mois  │  │ Factures │        │
│  │ 45,230 DA│  │    156   │  │    89    │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│  📈 Graphique des ventes                          │
│  ┌────────────────────────────────────┐          │
│  │ ▂▄▆█▆▄▂▄▆█▆▄▂                      │          │
│  └────────────────────────────────────┘          │
│                                                    │
│  🏆 Top 5 Clients                                 │
│  1. Client A - 125,000 DA                         │
│  2. Client B - 98,500 DA                          │
│  3. Client C - 87,200 DA                          │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 3. Menu Navigation

```
┌─────────────────────┐
│ 📦 Articles         │
│ 👥 Clients          │
│ 🏭 Fournisseurs     │
│ ─────────────────── │
│ 📄 Ventes           │
│   ├─ Bons Livraison│
│   ├─ Factures      │
│   └─ Proformas     │
│ ─────────────────── │
│ 📥 Achats           │
│   ├─ BL Achat      │
│   └─ Factures Achat│
│ ─────────────────── │
│ 💰 Paiements        │
│ 📊 Rapports         │
│ ⚙️  Paramètres      │
└─────────────────────┘
```

## 📄 Gestion des Documents

### Créer un Bon de Livraison (BL)

**Étape 1: Liste des BL**
```
┌──────────────────────────────────────────────────────┐
│ 📄 Bons de Livraison                [+ Nouveau BL]   │
├──────────────────────────────────────────────────────┤
│ 🔍 Recherche: [_________]  [Filtres ▼]              │
├──────────────────────────────────────────────────────┤
│ N° BL  │ Date       │ Client      │ Montant │ Statut│
├────────┼────────────┼─────────────┼─────────┼───────┤
│ 8703   │ 2025-12-30 │ Client A    │ 3,605 DA│ 🟢    │
│ 8702   │ 2025-12-29 │ Client B    │ 2,450 DA│ 🟡    │
│ 8701   │ 2025-12-28 │ Client C    │ 1,200 DA│ 🔴    │
└──────────────────────────────────────────────────────┘
```

**Étape 2: Formulaire Nouveau BL**
```
┌──────────────────────────────────────────────────────┐
│ Nouveau Bon de Livraison                             │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Client: [Sélectionner un client ▼]                  │
│ Date:   [2025-12-30]                                 │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ Articles                                       │  │
│ ├────────┬──────────┬────────┬────────┬─────────┤  │
│ │ Code   │ Désig.   │ Qté    │ Prix   │ Total   │  │
│ ├────────┼──────────┼────────┼────────┼─────────┤  │
│ │ ART001 │ Produit1 │ 10     │ 100 DA │ 1000 DA │  │
│ │ ART002 │ Produit2 │ 5      │ 200 DA │ 1000 DA │  │
│ │        │          │        │        │         │  │
│ └────────┴──────────┴────────┴────────┴─────────┘  │
│                                                      │
│ [+ Ajouter une ligne]                                │
│                                                      │
│ Montant HT:  2,000.00 DA                            │
│ TVA (19%):     380.00 DA                            │
│ ─────────────────────                               │
│ Total TTC:   2,380.00 DA                            │
│                                                      │
│ [Annuler]  [Sauvegarder]  [Sauvegarder et Imprimer]│
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Étape 3: BL Créé**
```
┌──────────────────────────────────────────────────────┐
│ BL N° 8704                    [Imprimer] [Modifier] │
├──────────────────────────────────────────────────────┤
│ Client: Client A                                     │
│ Date: 2025-12-30                                     │
│                                                      │
│ Articles:                                            │
│ - Produit 1 x 10 = 1,000 DA                         │
│ - Produit 2 x 5  = 1,000 DA                         │
│                                                      │
│ Total TTC: 2,380.00 DA                              │
│                                                      │
│ ┌──────────────────────────────────────────────┐    │
│ │ 💰 Paiements                                 │    │
│ ├──────────────────────────────────────────────┤    │
│ │ Aucun paiement enregistré                    │    │
│ │                                              │    │
│ │ [+ Ajouter un paiement]                      │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 💰 Gestion des Paiements

### Ajouter un Paiement

**Étape 1: Ouvrir le formulaire**
```
┌──────────────────────────────────────────────────────┐
│ Ajouter un Paiement - BL N° 8704                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Montant du document: 2,380.00 DA                    │
│ Déjà payé:              0.00 DA                     │
│ Reste à payer:      2,380.00 DA                     │
│                                                      │
│ ─────────────────────────────────────               │
│                                                      │
│ Montant: [__________] DA                            │
│                                                      │
│ Date: [2025-12-30]                                  │
│                                                      │
│ Méthode: [Espèces ▼]                                │
│          - Espèces                                   │
│          - Chèque                                    │
│          - Virement                                  │
│          - Carte bancaire                            │
│          - Traite                                    │
│                                                      │
│ Notes: [_____________________________]              │
│        [_____________________________]              │
│                                                      │
│ [Annuler]  [Enregistrer le paiement]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Étape 2: Paiement Enregistré**
```
┌──────────────────────────────────────────────────────┐
│ BL N° 8704 - Paiements                              │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📊 Résumé                                           │
│ Total:        2,380.00 DA                           │
│ Payé:         1,000.00 DA                           │
│ Reste:        1,380.00 DA                           │
│ Statut: 🟡 Partiellement payé                       │
│                                                      │
│ ─────────────────────────────────────               │
│                                                      │
│ 📝 Historique des paiements                         │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ 2025-12-30 | 1,000.00 DA | Espèces           │  │
│ │ Notes: Acompte                                │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ [+ Ajouter un paiement]                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Filtrer par Statut de Paiement

```
┌──────────────────────────────────────────────────────┐
│ 📄 Bons de Livraison                                │
├──────────────────────────────────────────────────────┤
│ 🔍 Recherche: [_________]  [Filtres ▼]              │
│                                                      │
│ ┌──────────────────────────────────────────────┐    │
│ │ Filtres Avancés                              │    │
│ ├──────────────────────────────────────────────┤    │
│ │ Date du: [__________] au: [__________]       │    │
│ │                                              │    │
│ │ Montant min: [_____] max: [_____]           │    │
│ │                                              │    │
│ │ Client: [Tous ▼]                             │    │
│ │                                              │    │
│ │ 💰 Statut de paiement:                       │    │
│ │ ○ Tous                                       │    │
│ │ ● 🟢 Payés totalement                        │    │
│ │ ○ 🟡 Partiellement payés                     │    │
│ │ ○ 🔴 Non payés (aucun paiement)              │    │
│ │                                              │    │
│ │ [Réinitialiser] [Appliquer]                 │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ Résultats: 15 BL trouvés                            │
│                                                      │
│ N° BL  │ Date       │ Client      │ Montant │ Statut│
├────────┼────────────┼─────────────┼─────────┼───────┤
│ 8703   │ 2025-12-30 │ Client A    │ 3,605 DA│ 🟢    │
│ 8699   │ 2025-12-28 │ Client D    │ 5,200 DA│ 🟢    │
│ 8695   │ 2025-12-25 │ Client E    │ 2,100 DA│ 🟢    │
└──────────────────────────────────────────────────────┘
```

## 📊 Rapports

### Rapport des Marges

```
┌──────────────────────────────────────────────────────┐
│ 📊 Rapport des Marges                               │
├──────────────────────────────────────────────────────┤
│ Période: [01/12/2025] au [31/12/2025]  [Filtrer]   │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ Résumé Global                                  │  │
│ ├────────────────────────────────────────────────┤  │
│ │ CA Total:        125,000.00 DA                 │  │
│ │ Coût Total:       85,000.00 DA                 │  │
│ │ Marge Totale:     40,000.00 DA                 │  │
│ │ Taux de Marge:    32.00%                       │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ Détail par Document:                                │
│                                                      │
│ N° Doc │ Type │ CA      │ Coût    │ Marge   │ %    │
├────────┼──────┼─────────┼─────────┼─────────┼──────┤
│ 8703   │ BL   │ 3,605 DA│ 2,400 DA│ 1,205 DA│ 33.4%│
│ 8702   │ BL   │ 2,450 DA│ 1,800 DA│   650 DA│ 26.5%│
│ 8701   │ Fact │ 5,200 DA│ 3,500 DA│ 1,700 DA│ 32.7%│
└──────────────────────────────────────────────────────┘
```

## ⚙️ Paramètres

### Changer de Base de Données

```
┌──────────────────────────────────────────────────────┐
│ ⚙️  Paramètres                                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Base de Données Active:                             │
│                                                      │
│ ┌────────────────┐  ┌────────────────┐             │
│ │ ✓ MySQL        │  │   Supabase     │             │
│ │ localhost:3306 │  │   Cloud        │             │
│ └────────────────┘  └────────────────┘             │
│                                                      │
│ Tenant Actif: 2025_bu01                             │
│                                                      │
│ [Changer de tenant]                                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 🖨️ Impression PDF

### Aperçu PDF d'un BL

```
┌──────────────────────────────────────────────────────┐
│ 🖨️  BON DE LIVRAISON N° 8704                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│ VOTRE ENTREPRISE                                    │
│ Adresse: 123 Rue Example                           │
│ Tél: +213 XXX XXX XXX                              │
│                                                      │
│ ─────────────────────────────────────               │
│                                                      │
│ Client: Client A                                    │
│ Adresse: 456 Avenue Client                         │
│                                                      │
│ Date: 30/12/2025                                    │
│                                                      │
│ ─────────────────────────────────────               │
│                                                      │
│ Désignation      │ Qté │ P.U.    │ Total           │
│ ─────────────────┼─────┼─────────┼─────────        │
│ Produit 1        │  10 │ 100 DA  │ 1,000 DA        │
│ Produit 2        │   5 │ 200 DA  │ 1,000 DA        │
│                                                      │
│ ─────────────────────────────────────               │
│                                                      │
│                          Montant HT: 2,000.00 DA    │
│                          TVA (19%):    380.00 DA    │
│                          ─────────────────────       │
│                          Total TTC:  2,380.00 DA    │
│                                                      │
│ Signature:                                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 🔐 Gestion des Utilisateurs (Admin)

```
┌──────────────────────────────────────────────────────┐
│ 👥 Gestion des Utilisateurs              [+ Nouveau]│
├──────────────────────────────────────────────────────┤
│                                                      │
│ Username │ Email           │ Rôle  │ Tenants │ Act. │
├──────────┼─────────────────┼───────┼─────────┼──────┤
│ admin    │ admin@ex.com    │ Admin │ Tous    │ ✓    │
│ user1    │ user1@ex.com    │ User  │ 2025_01 │ ✓    │
│ user2    │ user2@ex.com    │ User  │ 2025_02 │ ✓    │
└──────────────────────────────────────────────────────┘
```

## 📱 Version Mobile

L'interface s'adapte automatiquement aux petits écrans:

```
┌─────────────────────┐
│ ☰  Stock Mgmt       │
├─────────────────────┤
│                     │
│ 📊 Dashboard        │
│                     │
│ ┌─────────────────┐ │
│ │ CA Aujourd'hui  │ │
│ │   45,230 DA     │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ BL du Mois      │ │
│ │      156        │ │
│ └─────────────────┘ │
│                     │
│ [Nouveau BL]        │
│                     │
│ Derniers BL:        │
│ • 8704 - 2,380 DA   │
│ • 8703 - 3,605 DA   │
│ • 8702 - 2,450 DA   │
│                     │
└─────────────────────┘
```

## 💡 Astuces

### Raccourcis Clavier
- `Ctrl + N` : Nouveau document
- `Ctrl + P` : Imprimer
- `Ctrl + F` : Rechercher
- `Ctrl + S` : Sauvegarder

### Recherche Rapide
- Taper le numéro de BL directement
- Recherche par nom de client
- Recherche par montant

### Filtres Intelligents
- Combiner plusieurs filtres
- Sauvegarder les filtres favoris
- Exporter les résultats

### Performance
- Les filtres de paiement sont ultra-rapides (2 requêtes au lieu de 4689)
- Pagination automatique pour les grandes listes
- Cache intelligent pour les données fréquentes

## 🎓 Cas d'Usage Typiques

### Scénario 1: Vente Complète
1. Créer un BL pour le client
2. Imprimer et livrer
3. Enregistrer le paiement (total ou partiel)
4. Créer la facture depuis le BL
5. Imprimer la facture

### Scénario 2: Devis puis Vente
1. Créer un Proforma (devis)
2. Envoyer au client
3. Client accepte
4. Convertir en BL
5. Livrer et facturer

### Scénario 3: Suivi des Impayés
1. Aller dans "Bons de Livraison"
2. Filtrer par "Non payés"
3. Voir la liste des BL sans paiement
4. Relancer les clients
5. Enregistrer les paiements au fur et à mesure

### Scénario 4: Analyse des Marges
1. Aller dans "Rapports" > "Marges"
2. Sélectionner la période
3. Voir les marges par document
4. Identifier les produits les plus rentables
5. Ajuster les prix si nécessaire

## 📞 Support

Pour toute question:
- Consulter `GUIDE_INSTALLATION.md` pour l'installation
- Consulter `QUICK_START.md` pour un démarrage rapide
- Vérifier les logs du backend en cas d'erreur
- Utiliser les scripts de test fournis
