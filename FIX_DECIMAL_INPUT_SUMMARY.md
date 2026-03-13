# Correction de la saisie des décimales avec point (.)

## Problème
Les champs de saisie numérique n'acceptent que la virgule (,) comme séparateur décimal, pas le point (.).

## Solution appliquée
Modification de tous les champs de saisie numérique pour accepter à la fois le point (.) et la virgule (,).

## Fichiers modifiés

### 1. frontend/app/delivery-notes/page.tsx

#### Champ "Prix Unitaire" (ligne ~661)
```typescript
<input
  type="text"
  inputMode="decimal"
  value={currentLine.prix}
  onChange={(e) => {
    const value = e.target.value.replace(',', '.');
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setCurrentLine({ ...currentLine, prix: numValue });
    } else if (value === '' || value === '0') {
      setCurrentLine({ ...currentLine, prix: 0 });
    }
  }}
  onFocus={(e) => e.target.select()}
/>
```

#### Champ "TVA (%)" (ligne ~677)
```typescript
<input
  type="text"
  inputMode="decimal"
  value={currentLine.tva}
  onChange={(e) => {
    const value = e.target.value.replace(',', '.');
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setCurrentLine({ ...currentLine, tva: numValue });
    } else if (value === '' || value === '0') {
      setCurrentLine({ ...currentLine, tva: 0 });
    }
  }}
  onFocus={(e) => e.target.select()}
/>
```

#### Champ "Montant versé" (ligne ~810)
```typescript
<input
  type="text"
  inputMode="decimal"
  value={paymentAmount}
  onChange={(e) => {
    const value = e.target.value.replace(',', '.');
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= totals.totalTTC) {
      setPaymentAmount(numValue);
    } else if (value === '' || value === '0') {
      setPaymentAmount(0);
    }
  }}
  onFocus={(e) => e.target.select()}
  placeholder="0.00"
/>
```

### 2. frontend/app/invoices/page.tsx

#### Champ "Prix Unitaire" (ligne ~426)
```typescript
<input
  type="text"
  inputMode="decimal"
  value={currentLine.prix}
  onChange={(e) => {
    const value = e.target.value.replace(',', '.');
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setCurrentLine({ ...currentLine, prix: numValue });
    } else if (value === '' || value === '0') {
      setCurrentLine({ ...currentLine, prix: 0 });
    }
  }}
  onFocus={(e) => e.target.select()}
/>
```

#### Champ "TVA (%)" (ligne ~442)
```typescript
<input
  type="text"
  inputMode="decimal"
  value={currentLine.tva}
  onChange={(e) => {
    const value = e.target.value.replace(',', '.');
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setCurrentLine({ ...currentLine, tva: numValue });
    } else if (value === '' || value === '0') {
      setCurrentLine({ ...currentLine, tva: 0 });
    }
  }}
  onFocus={(e) => e.target.select()}
/>
```

#### Champ "Montant versé" (ligne ~541)
```typescript
<input
  type="text"
  inputMode="decimal"
  value={paymentAmount}
  onChange={(e) => {
    const value = e.target.value.replace(',', '.');
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= totals.totalTTC) {
      setPaymentAmount(numValue);
    } else if (value === '' || value === '0') {
      setPaymentAmount(0);
    }
  }}
  onFocus={(e) => e.target.select()}
  placeholder="0.00"
/>
```

## Changements clés

1. **type="text"** au lieu de **type="number"**
   - Permet un contrôle total sur la saisie
   - Évite les limitations du navigateur sur les séparateurs décimaux

2. **inputMode="decimal"**
   - Affiche le clavier numérique avec décimales sur mobile
   - Meilleure UX sur tablettes et smartphones

3. **value.replace(',', '.')**
   - Convertit automatiquement la virgule en point
   - Permet la saisie avec les deux séparateurs

4. **Validation stricte**
   - Vérifie que la valeur est un nombre valide
   - Limite les valeurs négatives
   - Limite la TVA entre 0 et 100%

5. **onFocus={(e) => e.target.select()}**
   - Sélectionne tout le texte au clic
   - Facilite la modification rapide

## Test

Pour tester, essayez de saisir:
- `10.50` → Devrait fonctionner ✅
- `10,50` → Devrait être converti en `10.50` ✅
- `10.` → Devrait être accepté (en cours de saisie)
- `10,` → Devrait être accepté (en cours de saisie)

## Si ça ne fonctionne toujours pas

1. **Vider le cache du navigateur**:
   - Chrome/Edge: Ctrl+Shift+Delete → Cocher "Images et fichiers en cache" → Effacer
   - Firefox: Ctrl+Shift+Delete → Cocher "Cache" → Effacer

2. **Forcer le rechargement**:
   - Ctrl+F5 (Windows)
   - Cmd+Shift+R (Mac)

3. **Redémarrer le serveur frontend**:
   ```bash
   # Arrêter le serveur (Ctrl+C)
   # Puis relancer
   npm run dev
   ```

4. **Vérifier que les modifications sont bien présentes**:
   - Ouvrir les DevTools (F12)
   - Onglet "Sources"
   - Chercher le fichier `page.tsx`
   - Vérifier que le code contient bien `type="text"` et `replace(',', '.')`

## Note importante

Si le problème persiste, il se peut que Next.js utilise une version en cache du build. Dans ce cas:

```bash
# Supprimer le cache Next.js
rm -rf .next
# Ou sur Windows
rmdir /s /q .next

# Puis relancer
npm run dev
```
