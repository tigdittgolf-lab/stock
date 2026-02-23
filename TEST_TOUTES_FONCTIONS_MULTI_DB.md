# Script de Test Complet Multi-Base de Données

## Objectif

Tester TOUTES les fonctionnalités avec les 3 bases de données pour s'assurer qu'il n'y a pas d'autres problèmes de structure.

## Méthodologie

Pour chaque fonctionnalité, tester avec:
1. ✅ Supabase (cloud)
2. ✅ MySQL (local)
3. ✅ PostgreSQL (local)

## Fonctionnalités à Tester

### 1. BL de Vente (Sales Delivery Notes)

| Fonctionnalité | Supabase | MySQL | PostgreSQL | Notes |
|----------------|----------|-------|------------|-------|
| Liste des BL | ⬜ | ⬜ | ⬜ | Vérifier affichage sans erreur |
| Détail d'un BL | ⬜ | ⬜ | ⬜ | Clic sur un BL |
| Génération PDF | ⬜ | ⬜ | ⬜ | Télécharger PDF |
| Création nouveau BL | ⬜ | ⬜ | ⬜ | Formulaire de création |

### 2. BL d'Achat (Purchase Delivery Notes) 🔧

| Fonctionnalité | Supabase | MySQL | PostgreSQL | Notes |
|----------------|----------|-------|------------|-------|
| Liste des BL | ⬜ | ⬜ | ⬜ | **FIX APPLIQUÉ** |
| Détail d'un BL | ⬜ | ⬜ | ⬜ | **FIX APPLIQUÉ** |
| Génération PDF | ⬜ | ⬜ | ⬜ | Télécharger PDF |
| Création nouveau BL | ⬜ | ⬜ | ⬜ | Formulaire de création |

### 3. Factures de Vente (Sales Invoices)

| Fonctionnalité | Supabase | MySQL | PostgreSQL | Notes |
|----------------|----------|-------|------------|-------|
| Liste des factures | ⬜ | ⬜ | ⬜ | Vérifier affichage |
| Détail d'une facture | ⬜ | ⬜ | ⬜ | Clic sur une facture |
| Génération PDF | ⬜ | ⬜ | ⬜ | Télécharger PDF |
| Création nouvelle facture | ⬜ | ⬜ | ⬜ | Formulaire de création |

### 4. Factures d'Achat (Purchase Invoices)

| Fonctionnalité | Supabase | MySQL | PostgreSQL | Notes |
|----------------|----------|-------|------------|-------|
| Liste des factures | ⬜ | ⬜ | ⬜ | Vérifier affichage |
| Détail d'une facture | ⬜ | ⬜ | ⬜ | Clic sur une facture |
| Génération PDF | ⬜ | ⬜ | ⬜ | Télécharger PDF |
| Création nouvelle facture | ⬜ | ⬜ | ⬜ | Formulaire de création |

### 5. Proformas

| Fonctionnalité | Supabase | MySQL | PostgreSQL | Notes |
|----------------|----------|-------|------------|-------|
| Liste des proformas | ⬜ | ⬜ | ⬜ | Vérifier affichage |
| Détail d'une proforma | ⬜ | ⬜ | ⬜ | Clic sur une proforma |
| Génération PDF | ⬜ | ⬜ | ⬜ | Télécharger PDF |
| Création nouvelle proforma | ⬜ | ⬜ | ⬜ | Formulaire de création |

### 6. Gestion des Données

| Fonctionnalité | Supabase | MySQL | PostgreSQL | Notes |
|----------------|----------|-------|------------|-------|
| Liste des clients | ⬜ | ⬜ | ⬜ | Affichage liste |
| Ajout client | ⬜ | ⬜ | ⬜ | Formulaire création |
| Modification client | ⬜ | ⬜ | ⬜ | Édition |
| Suppression client | ⬜ | ⬜ | ⬜ | Suppression |
| Liste des fournisseurs | ⬜ | ⬜ | ⬜ | Affichage liste |
| Ajout fournisseur | ⬜ | ⬜ | ⬜ | Formulaire création |
| Modification fournisseur | ⬜ | ⬜ | ⬜ | Édition |
| Suppression fournisseur | ⬜ | ⬜ | ⬜ | Suppression |
| Liste des articles | ⬜ | ⬜ | ⬜ | Affichage liste |
| Ajout article | ⬜ | ⬜ | ⬜ | Formulaire création |
| Modification article | ⬜ | ⬜ | ⬜ | Édition |
| Suppression article | ⬜ | ⬜ | ⬜ | Suppression |

## Procédure de Test

### Étape 1: Préparer l'Environnement

```bash
# Backend
cd backend
npm run dev

# Frontend (autre terminal)
cd frontend
npm run dev

# Ngrok (si test en production)
ngrok http 3005
```

### Étape 2: Tester avec Chaque Base de Données

1. **Se déconnecter** de l'application
2. **Se reconnecter** en choisissant la base de données
3. **Parcourir chaque fonctionnalité** dans l'ordre du tableau
4. **Cocher ✅** si OK, **Noter ❌** si erreur

### Étape 3: Vérifier les Logs

**Console Frontend (F12):**
- Chercher `🚨 CRITICAL`
- Chercher `❌ Error`
- Chercher `undefined` ou `null` dans les données

**Console Backend:**
- Chercher `🔀 DatabaseRouter:` pour voir quelle base est utilisée
- Chercher `❌` pour les erreurs
- Chercher `✅` pour les succès

### Étape 4: Documenter les Problèmes

Si une fonctionnalité échoue:

```markdown
## Problème Trouvé

**Fonctionnalité:** [Nom]
**Base de données:** [Supabase/MySQL/PostgreSQL]
**Erreur:** [Message d'erreur]
**Console log:** [Copier les logs pertinents]
**Fichier concerné:** [Chemin du fichier]
```

## Résultat Attendu

✅ Toutes les cases cochées pour les 3 bases de données
✅ Aucune erreur `CRITICAL` dans la console
✅ Comportement identique quelle que soit la base de données

## Priorité des Tests

1. **CRITIQUE:** BL d'achat (fix appliqué, à vérifier)
2. **HAUTE:** BL de vente, Factures
3. **MOYENNE:** Proformas
4. **BASSE:** Gestion des données (clients, fournisseurs, articles)

## Temps Estimé

- Test complet: 2-3 heures
- Test prioritaire (BL + Factures): 1 heure
- Test rapide (BL d'achat uniquement): 15 minutes
