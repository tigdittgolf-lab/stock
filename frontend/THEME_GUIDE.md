# 🎨 Guide du Système de Thème Dark/Light

## Vue d'ensemble

Ce système de thème offre une transition fluide entre les modes clair et sombre avec :
- ✅ Transitions CSS ultra-smooth (cubic-bezier)
- ✅ Persistance du choix utilisateur (localStorage)
- ✅ Détection automatique de la préférence système
- ✅ Variables CSS complètes pour tous les composants
- ✅ Contraste optimal pour la lisibilité
- ✅ Support responsive complet

## 🚀 Utilisation Rapide

### 1. Le bouton de toggle est déjà intégré

Le bouton de changement de thème apparaît automatiquement en haut à droite de toutes les pages.

### 2. Utiliser les variables CSS dans vos composants

```css
.myComponent {
  background: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
}

.myButton {
  background: var(--primary-color);
  color: white;
}

.myButton:hover {
  background: var(--primary-color-hover);
}
```

### 3. Utiliser le hook useTheme dans vos composants React

```tsx
'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Thème actuel : {theme}</p>
      <button onClick={toggleTheme}>
        Changer de thème
      </button>
    </div>
  );
}
```

## 📋 Variables CSS Disponibles

### Couleurs de fond
- `--background` : Fond principal
- `--background-secondary` : Fond secondaire
- `--background-tertiary` : Fond tertiaire
- `--card-background` : Fond des cartes
- `--card-background-hover` : Fond des cartes au survol

### Couleurs de texte
- `--text-primary` : Texte principal (contraste élevé)
- `--text-secondary` : Texte secondaire (contraste moyen)
- `--text-tertiary` : Texte tertiaire (contraste faible)
- `--text-inverse` : Texte inversé (pour boutons)

### Bordures
- `--border-color` : Couleur de bordure normale
- `--border-color-hover` : Couleur de bordure au survol

### Couleurs d'accent
- `--primary-color` : Couleur principale
- `--primary-color-hover` : Couleur principale au survol
- `--primary-color-light` : Version claire de la couleur principale

### Couleurs de statut
- `--success-color` / `--success-color-light` : Succès
- `--warning-color` / `--warning-color-light` : Avertissement
- `--error-color` / `--error-color-light` : Erreur
- `--info-color` / `--info-color-light` : Information

### Ombres
- `--shadow-sm` : Ombre petite
- `--shadow-md` : Ombre moyenne
- `--shadow-lg` : Ombre grande
- `--shadow-xl` : Ombre extra-grande

### Overlay
- `--overlay-background` : Fond pour les modales/overlays

## 🎯 Bonnes Pratiques

### 1. Toujours utiliser les variables CSS

❌ **Mauvais :**
```css
.card {
  background: #ffffff;
  color: #000000;
}
```

✅ **Bon :**
```css
.card {
  background: var(--card-background);
  color: var(--text-primary);
}
```

### 2. Respecter la hiérarchie des couleurs de texte

- `--text-primary` : Titres, texte important
- `--text-secondary` : Texte normal, descriptions
- `--text-tertiary` : Texte secondaire, métadonnées

### 3. Utiliser les couleurs de statut appropriées

```css
.successMessage {
  background: var(--success-color-light);
  color: var(--success-color);
  border-left: 4px solid var(--success-color);
}
```

### 4. Ajouter des transitions pour la fluidité

```css
.element {
  background: var(--card-background);
  color: var(--text-primary);
  /* Les transitions sont déjà globales, mais vous pouvez les personnaliser */
  transition: transform 0.2s ease;
}
```

## 🔧 Personnalisation

### Modifier les couleurs du thème

Éditez `frontend/app/globals.css` :

```css
:root[data-theme="light"] {
  --primary-color: #667eea; /* Changez cette valeur */
}

:root[data-theme="dark"] {
  --primary-color: #818cf8; /* Changez cette valeur */
}
```

### Ajouter de nouvelles variables

```css
:root[data-theme="light"] {
  --my-custom-color: #ff6b6b;
}

:root[data-theme="dark"] {
  --my-custom-color: #ff8787;
}
```

## 📱 Support Responsive

Le système de thème fonctionne parfaitement sur tous les appareils. Le bouton de toggle s'adapte automatiquement :

- Desktop : 50px × 50px
- Mobile : 45px × 45px

## 🎨 Exemples de Composants

Consultez `frontend/components/ThemeExample.tsx` pour voir des exemples complets d'utilisation.

## 🐛 Dépannage

### Le thème ne persiste pas après rechargement

Vérifiez que localStorage est accessible dans votre navigateur.

### Flash de contenu non stylisé (FOUC)

Le système inclut déjà `suppressHydrationWarning` dans le layout pour éviter ce problème.

### Les transitions sont trop lentes/rapides

Modifiez la durée dans `globals.css` :

```css
* {
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              /* Changez 0.3s à votre préférence */
}
```

## 📚 Ressources

- [Variables CSS MDN](https://developer.mozilla.org/fr/docs/Web/CSS/Using_CSS_custom_properties)
- [Cubic Bezier Generator](https://cubic-bezier.com/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## ✨ Fonctionnalités Avancées

### Détecter le thème dans les composants serveur

Les composants serveur ne peuvent pas utiliser le hook `useTheme`. Pour les composants qui doivent être conscients du thème, utilisez des composants client (`'use client'`).

### Animations personnalisées lors du changement de thème

Vous pouvez ajouter des animations spécifiques en écoutant les changements d'attribut `data-theme` :

```css
@keyframes themeChange {
  0% { opacity: 0.8; }
  100% { opacity: 1; }
}

[data-theme] {
  animation: themeChange 0.3s ease;
}
```

---

**Créé avec ❤️ pour une expérience utilisateur optimale**
