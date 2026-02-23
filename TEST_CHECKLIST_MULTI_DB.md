# Checklist de Test Multi-Base de Données

## Objectif

Vérifier que l'application fonctionne correctement avec les 3 bases de données après les corrections.

## Tests à Effectuer

### 1. BL de Vente (Sales Delivery Notes)

#### Avec Supabase
- [ ] Liste des BL de vente s'affiche
- [ ] Aucune erreur `CRITICAL: No valid ID found`
- [ ] Clic sur un BL ouvre le détail
- [ ] Génération PDF fonctionne

#### Avec MySQL
- [ ] Liste des BL de vente s'affiche
- [ ] Aucune erreur `CRITICAL: No valid ID found`
- [ ] Clic sur un BL ouvre le détail
- [ ] Génération PDF fonctionne

#### Avec PostgreSQL
- [ ] Liste des BL de vente s'affiche
- [ ] Aucune erreur `CRITICAL: No valid ID found`
- [ ] Clic sur un BL ouvre le détail
- [ ] Génération PDF fonctionne

### 2. BL d'Achat (Purchase Delivery Notes)

#### Avec Supabase
- [ ] Liste des BL d'achat s'affiche
- [ ] Aucune erreur `CRITICAL: No valid ID found`
- [ ] Clic sur un BL ouvre le détail
- [ ] Génération PDF fonctionne

#### Avec MySQL (🔧 FIX APPLIQUÉ)
- [ ] Liste des BL d'achat s'affiche
- [ ] Aucune erreur `CRITICAL: No valid ID found`
- [ ] Clic sur un BL ouvre le détail
- [ ] Génération PDF fonctionne

#### Avec PostgreSQL (🔧 FIX APPLIQUÉ)
- [ ] Liste des BL d'achat s'affiche
- [ ] Aucune erreur `CRITICAL: No valid ID found`
- [ ] Clic sur un BL ouvre le détail
- [ ] Génération PDF fonctionne

### 3. Autres Fonctionnalités (Vérification Rapide)

#### Avec les 3 bases de données
- [ ] Liste des clients
- [ ] Liste des fournisseurs
- [ ] Liste des articles
- [ ] Création d'un nouveau BL de vente
- [ ] Création d'un nouveau BL d'achat

## Comment Tester

1. **Redémarrer le backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Tester avec chaque base de données**
   - Se déconnecter
   - Se reconnecter en choisissant la base de données (Supabase, MySQL, ou PostgreSQL)
   - Naviguer vers "BL de Vente" et "BL d'Achat"
   - Vérifier la console pour les erreurs

3. **Vérifier les logs backend**
   - Chercher `🔀 DatabaseRouter:` pour voir quelle base est utilisée
   - Chercher `❌` pour les erreurs
   - Chercher `✅` pour les succès

## Logs à Surveiller

### Logs Positifs
```
🔀 DatabaseRouter: get_purchase_bl_list → mysql
✅ Returning XXX purchase delivery notes
```

### Logs Négatifs (à éviter)
```
🚨 CRITICAL: No valid ID found for BL: {}
❌ Failed to fetch purchase BL
```

## Résultat Attendu

✅ Tous les tests passent avec les 3 bases de données
✅ Aucune erreur `CRITICAL: No valid ID found`
✅ Structure de données cohérente entre Supabase, MySQL et PostgreSQL
