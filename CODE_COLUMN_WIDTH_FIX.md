# Correction de la Largeur de la Colonne Code

## Problème
Dans le tableau des articles du dashboard, la colonne "Code" avait une largeur fixe de 80px, ce qui était insuffisant pour afficher complètement les codes d'articles comme "ART001" (6 caractères). Le code s'affichait tronqué comme "ART0..." avec des points de suspension.

## Cause
```tsx
// Avant
<th style={{ width: '80px', maxWidth: '80px' }}>Code</th>
<td style={{ width: '80px', maxWidth: '80px', ... }}>{article.narticle}</td>
```

La largeur de 80px était trop petite pour afficher 6 caractères avec la police et le padding utilisés.

## Solution Appliquée

### Fichier: `frontend/app/dashboard/page.tsx`

**Header du tableau:**
```tsx
// Après
<th style={{ width: '100px', maxWidth: '100px' }}>Code</th>
```

**Cellules du tableau:**
```tsx
// Après
<td style={{ 
  fontWeight: 'bold', 
  width: '100px', 
  maxWidth: '100px', 
  overflow: 'hidden', 
  textOverflow: 'ellipsis', 
  whiteSpace: 'nowrap' 
}}>
  {article.narticle}
</td>
```

## Changements
- ✅ Largeur de la colonne Code augmentée de 80px à 100px
- ✅ Header et cellules synchronisés
- ✅ Propriétés overflow maintenues pour les codes très longs
- ✅ Cohérence visuelle préservée

## Bénéfices

1. **Lisibilité**: Les codes d'articles s'affichent maintenant complètement
2. **Professionnalisme**: Plus de troncature gênante
3. **Flexibilité**: Supporte des codes jusqu'à environ 8-10 caractères
4. **Sécurité**: Le overflow est toujours géré pour les codes exceptionnellement longs

## Autres Tableaux

Les tableaux Clients et Fournisseurs n'ont pas de largeur fixe pour la colonne Code, ils s'adaptent automatiquement au contenu et ne nécessitent pas de modification.

## Test

Pour vérifier la correction:
1. Ouvrir le dashboard
2. Aller à l'onglet "Articles"
3. Vérifier que les codes d'articles (ART001, ART002, etc.) s'affichent complètement
4. Tester avec différents codes de longueurs variées

## Codes Supportés

Avec 100px de largeur:
- ✅ ART001 (6 caractères)
- ✅ ART0001 (7 caractères)
- ✅ PROD001 (7 caractères)
- ✅ ARTICLE01 (9 caractères)
- ⚠️ Codes > 10 caractères seront tronqués avec "..."
