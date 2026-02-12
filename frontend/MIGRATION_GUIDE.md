# 🔄 Guide de Migration des Composants Existants

Ce guide vous aide à adapter vos composants existants pour utiliser le nouveau système de thème.

## 📋 Checklist de Migration

- [ ] Remplacer les couleurs hardcodées par des variables CSS
- [ ] Ajouter `'use client'` si vous utilisez le hook `useTheme`
- [ ] Tester dans les deux modes (light/dark)
- [ ] Vérifier le contraste des textes
- [ ] Vérifier les bordures et ombres

## 🔧 Exemples de Migration

### Exemple 1 : Composant Simple

#### ❌ Avant (hardcodé)

```tsx
export default function Card() {
  return (
    <div style={{
      background: '#ffffff',
      color: '#000000',
      border: '1px solid #e0e0e0',
      padding: '20px',
      borderRadius: '8px'
    }}>
      <h3 style={{ color: '#333333' }}>Titre</h3>
      <p style={{ color: '#666666' }}>Description</p>
    </div>
  );
}
```

#### ✅ Après (avec variables CSS)

```tsx
import styles from './Card.module.css';

export default function Card() {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Titre</h3>
      <p className={styles.description}>Description</p>
    </div>
  );
}
```

```css
/* Card.module.css */
.card {
  background: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
}

.title {
  color: var(--text-primary);
  margin-bottom: 8px;
}

.description {
  color: var(--text-secondary);
  line-height: 1.6;
}
```

### Exemple 2 : Boutons

#### ❌ Avant

```tsx
<button style={{
  background: '#667eea',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px'
}}>
  Cliquer
</button>
```

#### ✅ Après

```tsx
<button className={styles.button}>
  Cliquer
</button>
```

```css
.button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button:hover {
  background: var(--primary-color-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### Exemple 3 : Formulaires

#### ❌ Avant

```tsx
<input 
  type="text"
  style={{
    background: 'white',
    color: 'black',
    border: '1px solid #ccc',
    padding: '8px 12px'
  }}
/>
```

#### ✅ Après

```tsx
<input 
  type="text"
  className={styles.input}
/>
```

```css
.input {
  background: var(--background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 1rem;
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-color-light);
}
```

### Exemple 4 : Alertes/Notifications

#### ❌ Avant

```tsx
<div style={{
  background: '#d4edda',
  color: '#155724',
  border: '1px solid #c3e6cb',
  padding: '12px',
  borderRadius: '4px'
}}>
  Succès !
</div>
```

#### ✅ Après

```tsx
<div className={styles.alertSuccess}>
  Succès !
</div>
```

```css
.alertSuccess {
  background: var(--success-color-light);
  color: var(--success-color);
  border: 1px solid var(--success-color);
  border-left: 4px solid var(--success-color);
  padding: 12px;
  border-radius: 4px;
}

.alertWarning {
  background: var(--warning-color-light);
  color: var(--warning-color);
  border: 1px solid var(--warning-color);
  border-left: 4px solid var(--warning-color);
  padding: 12px;
  border-radius: 4px;
}

.alertError {
  background: var(--error-color-light);
  color: var(--error-color);
  border: 1px solid var(--error-color);
  border-left: 4px solid var(--error-color);
  padding: 12px;
  border-radius: 4px;
}
```

### Exemple 5 : Navigation/Header

#### ❌ Avant

```tsx
<nav style={{
  background: '#2c3e50',
  color: 'white',
  padding: '16px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}}>
  <a href="/" style={{ color: 'white' }}>Accueil</a>
</nav>
```

#### ✅ Après

```tsx
<nav className={styles.nav}>
  <a href="/" className={styles.navLink}>Accueil</a>
</nav>
```

```css
.nav {
  background: var(--card-background);
  color: var(--text-primary);
  padding: 16px;
  box-shadow: var(--shadow-md);
  border-bottom: 1px solid var(--border-color);
}

.navLink {
  color: var(--text-primary);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.navLink:hover {
  background: var(--background-secondary);
  color: var(--primary-color);
}
```

## 🎨 Mapping des Couleurs

Utilisez ce tableau pour convertir vos couleurs :

| Ancien (hardcodé) | Nouveau (variable CSS) | Usage |
|-------------------|------------------------|-------|
| `#ffffff`, `white` | `var(--background)` | Fond principal |
| `#f5f5f5`, `#fafafa` | `var(--background-secondary)` | Fond secondaire |
| `#000000`, `black`, `#333` | `var(--text-primary)` | Texte principal |
| `#666666`, `#777` | `var(--text-secondary)` | Texte secondaire |
| `#999999`, `#aaa` | `var(--text-tertiary)` | Texte tertiaire |
| `#e0e0e0`, `#ddd` | `var(--border-color)` | Bordures |
| `#667eea`, `#5a67d8` | `var(--primary-color)` | Couleur principale |
| `#48bb78`, `green` | `var(--success-color)` | Succès |
| `#ed8936`, `orange` | `var(--warning-color)` | Avertissement |
| `#f56565`, `red` | `var(--error-color)` | Erreur |
| `#4299e1`, `blue` | `var(--info-color)` | Information |

## 🔍 Rechercher et Remplacer

Utilisez ces regex pour trouver les couleurs hardcodées :

### Dans les fichiers CSS/SCSS
```regex
background:\s*#[0-9a-fA-F]{3,6}
color:\s*#[0-9a-fA-F]{3,6}
border.*:\s*.*#[0-9a-fA-F]{3,6}
```

### Dans les fichiers TSX/JSX
```regex
style={{.*background.*['"]#[0-9a-fA-F]{3,6}['"]
style={{.*color.*['"]#[0-9a-fA-F]{3,6}['"]
```

## 📝 Script de Migration Automatique

Créez un script pour automatiser la migration :

```javascript
// migrate-colors.js
const fs = require('fs');
const path = require('path');

const colorMap = {
  '#ffffff': 'var(--background)',
  'white': 'var(--background)',
  '#000000': 'var(--text-primary)',
  'black': 'var(--text-primary)',
  '#333333': 'var(--text-primary)',
  '#666666': 'var(--text-secondary)',
  '#999999': 'var(--text-tertiary)',
  '#e0e0e0': 'var(--border-color)',
  '#667eea': 'var(--primary-color)',
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  Object.entries(colorMap).forEach(([oldColor, newVar]) => {
    const regex = new RegExp(oldColor, 'gi');
    content = content.replace(regex, newVar);
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Migré: ${filePath}`);
}

// Utilisation
// migrateFile('./components/MyComponent.module.css');
```

## ✅ Checklist par Composant

Pour chaque composant à migrer :

1. **Identifier les couleurs hardcodées**
   - [ ] Couleurs de fond
   - [ ] Couleurs de texte
   - [ ] Couleurs de bordure
   - [ ] Ombres

2. **Remplacer par des variables CSS**
   - [ ] Créer/modifier le fichier `.module.css`
   - [ ] Utiliser les variables appropriées
   - [ ] Ajouter les transitions si nécessaire

3. **Tester**
   - [ ] Mode light
   - [ ] Mode dark
   - [ ] Transitions fluides
   - [ ] Contraste suffisant

4. **Optimiser**
   - [ ] Supprimer les styles inline
   - [ ] Regrouper les styles similaires
   - [ ] Ajouter les états hover/focus

## 🎯 Priorités de Migration

Migrez dans cet ordre :

1. **Haute priorité** : Composants visibles sur toutes les pages
   - Header/Navigation
   - Footer
   - Boutons principaux
   - Formulaires de connexion

2. **Priorité moyenne** : Composants fréquemment utilisés
   - Cartes
   - Listes
   - Tableaux
   - Modales

3. **Basse priorité** : Composants spécifiques
   - Pages d'erreur
   - Composants admin
   - Composants de debug

## 🚀 Conseils Pro

1. **Utilisez les CSS Modules** : Plus maintenable que les styles inline
2. **Testez régulièrement** : Changez de thème fréquemment pendant le dev
3. **Documentez** : Ajoutez des commentaires pour les choix de couleurs
4. **Soyez cohérent** : Utilisez toujours les mêmes variables pour les mêmes usages
5. **Pensez accessibilité** : Vérifiez le contraste dans les deux modes

## 📚 Ressources Utiles

- [Guide complet du thème](./THEME_GUIDE.md)
- [Documentation d'implémentation](../THEME_IMPLEMENTATION.md)
- [Composant d'exemple](./components/ThemeExample.tsx)
- [Test standalone](./test-theme.html)

---

**Besoin d'aide ?** Consultez les exemples dans `components/ThemeExample.tsx`
