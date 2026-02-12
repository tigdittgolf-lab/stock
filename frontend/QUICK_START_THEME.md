# 🚀 Démarrage Rapide - Système de Thème

## ✅ Installation Terminée !

Le système de thème dark/light est déjà installé et fonctionnel dans votre application.

## 🎯 Tester Immédiatement

### 1. Démarrer l'application

```bash
cd frontend
npm run dev
```

### 2. Visiter les pages

- **Page d'accueil** : http://localhost:3000
- **Démo complète** : http://localhost:3000/theme-demo
- **Test standalone** : Ouvrir `frontend/test-theme.html` dans votre navigateur

### 3. Utiliser le toggle

Cliquez sur le bouton en haut à droite (🌙/☀️) pour changer de thème.

## 📝 Utilisation dans Vos Composants

### Option 1 : CSS Modules (Recommandé)

```tsx
// MonComposant.tsx
import styles from './MonComposant.module.css';

export default function MonComposant() {
  return <div className={styles.container}>Contenu</div>;
}
```

```css
/* MonComposant.module.css */
.container {
  background: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

### Option 2 : Hook useTheme

```tsx
'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function MonComposant() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Mode : {theme}</p>
      <button onClick={toggleTheme}>Changer</button>
    </div>
  );
}
```

## 🎨 Variables CSS Essentielles

```css
/* Fonds */
--background
--card-background

/* Textes */
--text-primary
--text-secondary
--text-tertiary

/* Couleurs */
--primary-color
--success-color
--warning-color
--error-color

/* Bordures et Ombres */
--border-color
--shadow-md
```

## 📚 Documentation Complète

- **Guide complet** : `frontend/THEME_GUIDE.md`
- **Guide de migration** : `frontend/MIGRATION_GUIDE.md`
- **Implémentation** : `THEME_IMPLEMENTATION.md`

## 🎓 Exemples

Consultez ces fichiers pour des exemples concrets :

1. `frontend/components/ThemeExample.tsx` - Composant d'exemple
2. `frontend/app/theme-demo/page.tsx` - Démo interactive complète
3. `frontend/app/page.tsx` - Page d'accueil adaptée

## ✨ Fonctionnalités

✅ Transitions fluides (0.3s cubic-bezier)
✅ Persistance localStorage
✅ Détection préférence système
✅ Contraste optimal (WCAG AAA)
✅ 30+ variables CSS
✅ Support responsive
✅ Scrollbar personnalisée

## 🔧 Personnalisation Rapide

Pour changer les couleurs, éditez `frontend/app/globals.css` :

```css
:root[data-theme="light"] {
  --primary-color: #votre-couleur;
}

:root[data-theme="dark"] {
  --primary-color: #votre-couleur;
}
```

## 🐛 Problème ?

1. Vérifiez que vous utilisez `'use client'` pour les composants interactifs
2. Vérifiez que vous importez bien `globals.css`
3. Consultez la console pour les erreurs

## 🎉 C'est Tout !

Votre système de thème est prêt à l'emploi. Commencez à l'utiliser dans vos composants !

---

**Besoin d'aide ?** Consultez `THEME_GUIDE.md` pour plus de détails.
