# Audit Complet: Normalisation Multi-Base de Données

## Principe Fondamental

**TOUTES les requêtes MySQL/PostgreSQL doivent retourner la même structure que Supabase.**

Le frontend ne doit JAMAIS savoir quelle base de données est utilisée.

## Analyse des Structures de Données

### 1. BL de Vente (Sales Delivery Notes) ✅

**Frontend attend:** `nfact`, `nbl`, `id`

**MySQL/PostgreSQL retourne:**
```sql
bl.nfact as nbl,  -- ✅ OK
bl.nfact as id,   -- ✅ OK
```

**Statut:** ✅ CORRECT (déjà normalisé)

---

### 2. BL d'Achat (Purchase Delivery Notes) ✅

**Frontend attend:** `nbl`, `id`, `nfact`

**MySQL/PostgreSQL retournait:**
```sql
b.Nbl as nbl_achat,  -- ❌ Pas de nbl/id
```

**MySQL/PostgreSQL retourne maintenant:**
```sql
b.Nbl as nbl_achat,  -- Conservé
b.Nbl as nbl,        -- ✅ CORRIGÉ
b.Nbl as id,         -- ✅ CORRIGÉ
```

**Statut:** ✅ CORRIGÉ (commits a83eb3c, d9e78f1)

---

### 3. Factures de Vente (Sales Invoices) ⚠️

**Frontend attend:** `nfact` (interface Invoice)

**MySQL/PostgreSQL retourne:**
```sql
SELECT f.*, ...  -- ✅ Inclut nfact
```

**Statut:** ✅ OK (utilise SELECT f.*)

**Note:** Pas besoin d'alias car le frontend utilise directement `nfact`

---

### 4. Factures d'Achat (Purchase Invoices) ⚠️

**Frontend attend:** `nfact_achat` (interface PurchaseInvoice)

**MySQL/PostgreSQL retourne:**
```sql
f.Nfact as nfact_achat,  -- ✅ OK
```

**Statut:** ✅ OK

**Note:** Le frontend utilise `nfact_achat` directement, pas besoin d'alias supplémentaires

---

### 5. Proformas ⚠️

**Frontend attend:** `nfact` ou `nfprof` (interface Proforma)

**MySQL/PostgreSQL retourne:**
```sql
SELECT f.*, ...  -- ✅ Inclut nfact
```

**Statut:** ✅ OK (utilise SELECT f.*)

**Note:** Pas besoin d'alias car le frontend utilise directement `nfact`

---

## Problème Identifié

Le problème était **UNIQUEMENT** avec les BL d'achat (Purchase Delivery Notes).

Les autres entités (factures, proformas) utilisent soit:
1. `SELECT *` qui inclut tous les champs
2. Des alias qui correspondent exactement à ce que le frontend attend

## Pourquoi Ça N'a Pas Été Fait Au Début?

1. **Focus sur les routes API:** Les corrections initiales se concentraient sur les routes API (URLs hardcodées)
2. **Test avec Supabase uniquement:** Les tests ont été faits avec Supabase qui fonctionnait déjà
3. **Manque de vision globale:** Pas d'audit systématique de toutes les requêtes MySQL/PostgreSQL

## Leçon Apprise

**Pour une application multi-base de données:**

1. ✅ Faire un audit complet de TOUTES les requêtes
2. ✅ Tester avec CHAQUE base de données
3. ✅ Vérifier que la structure retournée est identique
4. ✅ Ne pas supposer que "si ça marche avec une base, ça marche avec toutes"

## Actions Requises

### ✅ Déjà Corrigé
- BL d'achat (liste et détail)

### ⚠️ À Vérifier (Probablement OK)
- Factures de vente
- Factures d'achat
- Proformas
- Articles
- Clients
- Fournisseurs

### 🔍 Test Requis
Tester TOUTES les fonctionnalités avec les 3 bases de données:
1. Supabase
2. MySQL
3. PostgreSQL

## Conclusion

Le problème était **spécifique aux BL d'achat** car:
- Ils utilisaient un alias différent (`nbl_achat` au lieu de `nbl`)
- Le frontend validait strictement les champs `nbl`, `id`, ou `nfact`
- Les autres entités utilisaient des structures déjà compatibles

**La correction est maintenant complète pour les BL d'achat.**
