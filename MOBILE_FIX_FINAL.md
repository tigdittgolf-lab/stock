# FIX MOBILE - INSTRUCTIONS FINALES

## Problème
Le sidebar reste visible sur mobile au lieu d'être caché avec un hamburger menu.

## Solution

### 1. Vérifier le HTML
Ouvre DevTools (F12) sur mobile et inspecte le sidebar. Note:
- Le nom de la balise (probablement `<aside>`)
- Les classes CSS appliquées

### 2. Ajouter ce CSS dans `frontend/app/globals.css` (à la fin)

```css
/* FIX MOBILE - FORCER LE SIDEBAR CACHÉ */
@media (max-width: 768px) {
  /* Cibler le sidebar - AJUSTE le sélecteur selon ton HTML */
  aside,
  [class*="sidebar"],
  nav[class*="sidebar"] {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    width: 240px !important;
    transform: translateX(-100%) !important;
    transition: transform 0.3s ease !important;
    z-index: 1001 !important;
  }
  
  /* Quand ouvert */
  aside.open,
  [class*="sidebar"].open,
  [class*="open"] aside {
    transform: translateX(0) !important;
  }
  
  /* Hamburger visible */
  button[style*="right: 12px"] {
    display: flex !important;
  }
  
  /* Main pleine largeur */
  main {
    margin-left: 0 !important;
    width: 100% !important;
  }
}
```

### 3. Forcer le rechargement
```cmd
cd frontend
rmdir /s /q .next
npm run dev
```

### 4. Tester
- Ouvre en navigation privée (Ctrl+Shift+N)
- Ajoute `?v=3` à l'URL: `http://localhost:3000/dashboard?v=3`
- Vide le cache: Ctrl+Shift+Delete → Tout supprimer

## Si ça ne marche toujours pas

Le problème est le cache du navigateur. Fais ceci:

1. **Désactive le cache dans DevTools**:
   - F12 → Onglet Network
   - Coche "Disable cache"
   - Garde DevTools ouvert

2. **Hard refresh**: Ctrl+Shift+R (plusieurs fois)

3. **Vérifie dans DevTools**:
   - Inspecte le sidebar
   - Regarde l'onglet "Computed" 
   - Cherche `transform` - doit être `translateX(-100%)`
   - Si ce n'est pas là, le CSS n'est pas chargé

## Alternative: CSS inline dans le composant

Si le CSS global ne marche pas, ajoute directement dans `frontend/app/dashboard/page.tsx`:

```tsx
<aside 
  className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}
  style={{
    transform: typeof window !== 'undefined' && window.innerWidth <= 768 
      ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') 
      : 'translateX(0)'
  }}
>
```

Bon courage!
