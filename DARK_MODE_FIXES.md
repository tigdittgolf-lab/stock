# Corrections du Mode Sombre - Pages Gestion du Stock et Dashboard

## Problèmes Identifiés

### 1. Page "Gestion du Stock"
La page utilisait des couleurs codées en dur dans les styles inline, rendant le texte illisible en mode sombre.

### 2. Page Dashboard - Navigation invisible en mode clair
Les boutons de navigation (📊 Tableau de Bord, 📦 Articles, etc.) avaient `color: white` mais étaient affichés sur un fond clair (`var(--background)`), les rendant invisibles en mode light.

### 3. Tableau "Articles sous seuil" - Colonnes illisibles en mode sombre
Le tableau des articles sous seuil dans le dashboard avait des fonds de lignes codés en dur (`#f8d7da`, `#fff3cd`) avec du texte par défaut, créant un problème de contraste en mode sombre. Les colonnes Code, Stock Facture, Stock BL et Seuil étaient particulièrement affectées.

## Solutions Appliquées

### 1. Page Stock (`frontend/app/stock/page.tsx`)
Remplacement de toutes les couleurs codées en dur par des variables CSS du thème :

- **Contexte header** : `#666` → `rgba(255, 255, 255, 0.9)`
- **Cartes de statistiques** : `#f8f9fa`, `white` → `var(--card-background)`, `var(--background-secondary)`
- **Textes** : `#495057`, `#6c757d` → `var(--text-primary)`, `var(--text-secondary)`
- **Bordures** : `#dee2e6` → `var(--border-color)`
- **Couleurs d'accent** :
  - Rouge : `#dc3545` → `var(--error-color)`
  - Vert : `#28a745` → `var(--success-color)`
  - Jaune : `#ffc107` → `var(--warning-color)`
  - Bleu : `#17a2b8`, `#6f42c1` → `var(--info-color)`, `var(--primary-color)`

### 2. Boîtes d'alerte
- **Configuration requise** : Fond `#fff3cd` → `var(--warning-color-light)`
- **Résumé des alertes** : Fond `#fff3cd` → `var(--warning-color-light)`
- **Aucune alerte** : Fond `#d4edda` → `var(--success-color-light)`
- **Info système** : Fond `#d1ecf1` → `var(--info-color-light)`

### 3. Tableaux
- **Lignes surstock** : Fond `#d1ecf1` → `var(--info-color-light)`

### 4. CSS Paiements (`frontend/app/payments/outstanding/page.module.css`)
Correction complète du fichier pour supporter le mode sombre :

- Titres, sous-titres, labels
- Cartes de statistiques
- Champs de formulaire (inputs, selects)
- États de focus avec `var(--primary-color)`
- Tableaux et lignes cliquables
- Messages d'erreur et de chargement
- Badges et indicateurs de montants

### 5. Page Dashboard (`frontend/app/dashboard/page.tsx`)
Ajout d'un wrapper avec fond coloré autour de la navigation :

```tsx
<div style={{
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '12px',
  padding: '12px',
  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
}}>
  <nav className={styles.nav} style={{ padding: 0 }}>
    {/* Boutons de navigation */}
  </nav>
</div>
```

Cela garantit que les boutons blancs sont toujours visibles sur un fond violet, dans les deux modes.

### 6. Tableau Articles sous seuil (`frontend/app/dashboard/page.tsx`)

Correction des couleurs du tableau pour assurer la lisibilité en mode sombre :

**Avant:**
```tsx
<tr style={{ backgroundColor: isZeroStock ? '#f8d7da' : '#fff3cd' }}>
  <td style={{ fontWeight: 'bold' }}>{article.narticle}</td>
  <td style={{ textAlign: 'center' }}>{article.stock_f}</td>
  <td style={{ textAlign: 'center' }}>{article.stock_bl}</td>
  <td style={{ textAlign: 'center' }}>{article.seuil}</td>
</tr>
```

**Après:**
```tsx
<tr style={{ backgroundColor: isZeroStock ? 'var(--error-color-light)' : 'var(--warning-color-light)' }}>
  <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{article.narticle}</td>
  <td style={{ textAlign: 'center', color: 'var(--text-primary)' }}>{article.stock_f}</td>
  <td style={{ textAlign: 'center', color: 'var(--text-primary)' }}>{article.stock_bl}</td>
  <td style={{ textAlign: 'center', color: 'var(--text-primary)' }}>{article.seuil}</td>
</tr>
```

**Colonnes corrigées:**
- Code : `color: 'var(--text-primary)'`
- Stock Facture : `color: 'var(--text-primary)'`
- Stock BL : `color: 'var(--text-primary)'`
- Seuil : `color: 'var(--text-primary)'`
- Désignation : `color: 'var(--primary-color)'`
- Différence : `color: 'var(--error-color)' ou 'var(--success-color)'`

**Fonds de lignes:**
- Rupture : `var(--error-color-light)` (rouge adaptatif)
- Stock faible : `var(--warning-color-light)` (jaune adaptatif)

## Variables CSS Utilisées

Les variables suivantes du système de thème sont maintenant utilisées :

```css
/* Fonds */
--background
--background-secondary
--card-background
--card-background-hover

/* Textes */
--text-primary
--text-secondary

/* Bordures */
--border-color

/* Couleurs d'accent */
--primary-color
--primary-color-hover
--primary-color-light
--success-color
--success-color-light
--warning-color
--warning-color-light
--error-color
--error-color-light
--info-color
--info-color-light

/* Ombres */
--shadow-md
```

## Résultat

✅ Tous les textes sont maintenant lisibles en mode sombre
✅ La navigation du dashboard est visible en mode clair ET sombre
✅ Le tableau "Articles sous seuil" est parfaitement lisible dans les deux modes
✅ Les colonnes Code, Stock Facture, Stock BL et Seuil ont un contraste optimal
✅ Les contrastes respectent les standards d'accessibilité
✅ Les transitions entre modes sont fluides
✅ Aucune erreur de diagnostic

## Test

Pour tester les changements :
1. Ouvrir la page Dashboard
2. Vérifier que les boutons de navigation (📊 Tableau de Bord, 📦 Articles, etc.) sont visibles
3. Scroller jusqu'à la section "Articles sous seuil"
4. Basculer entre mode clair et mode sombre avec le bouton en bas à droite
5. Vérifier que toutes les colonnes du tableau sont lisibles dans les deux modes
6. Ouvrir la page "Gestion du Stock"
7. Vérifier la lisibilité de tous les éléments dans les deux modes
