# FORCER LE RECHARGEMENT - IMPORTANT ⚠️

## Le Problème
Les modifications CSS ne sont pas visibles car le navigateur utilise le cache.

## Solution: Vider le Cache Complètement

### Chrome/Edge
1. Ouvrir DevTools (F12)
2. Clic droit sur le bouton Actualiser (à côté de la barre d'adresse)
3. Choisir **"Vider le cache et effectuer une actualisation forcée"**

OU

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Network**
3. Cocher **"Disable cache"**
4. Actualiser la page (F5)

### Firefox
1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Network**
3. Cocher **"Disable cache"**
4. Actualiser la page (F5)

## Vérification Rapide

Ouvrez la console (F12) et tapez:
```javascript
window.innerWidth
```

Si < 768, vous devriez voir:
- Sidebar cachée (pas de moitié vide à gauche)
- Bouton ☰ en haut à droite
- Contenu sur toute la largeur

## Si Ça Ne Marche Toujours Pas

1. Fermez TOUS les onglets du site
2. Fermez le navigateur complètement
3. Rouvrez et allez sur http://localhost:3000
4. Ouvrez DevTools (F12)
5. Mode mobile (Ctrl+Shift+M)
6. Choisissez "iPhone SE" ou "iPhone 12"
7. Actualisez (F5)

## Vérifier les Styles Appliqués

Dans DevTools:
1. Inspectez l'élément avec la classe "sidebar"
2. Regardez les styles appliqués
3. Vous devriez voir: `transform: translateX(-100%)`

Si vous voyez `transform: translateX(0)`, le cache n'est pas vidé.
