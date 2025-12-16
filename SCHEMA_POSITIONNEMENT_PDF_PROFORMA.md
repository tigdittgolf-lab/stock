# SCHÉMA POSITIONNEMENT PDF PROFORMA

## AVANT (Problématique)
```
Y=20   FACTURE PROFORMA
Y=35   ==================
Y=45   ETS BENAMAR...          Proforma N: 1
Y=50   Commerce Outillage      Date: 15/12/2025
Y=55   10, Rue Belhandouz...
Y=60   Tél: (213)045...
Y=65   Email: outillage...
Y=70   NIF: 10227010...
Y=75   RC: 21A3965999...
Y=80   Client: ← CHEVAUCHEMENT!
Y=85   cl1 nom1
Y=90   Mostaganem
Y=110  [TABLE HEADER] ← Position fixe
```

## APRÈS (Corrigé)
```
Y=20   FACTURE PROFORMA
Y=35   ==================
Y=45   ETS BENAMAR...          Proforma N: 1
Y=50   Commerce Outillage      Date: 15/12/2025
Y=55   10, Rue Belhandouz...
Y=60   Tél: (213)045...
Y=65   Email: outillage...
Y=70   NIF: 10227010...
Y=75   RC: 21A3965999...
Y=80   Art: 100227010...
Y=90   ← Espacement automatique (10 points)
Y=90   Client:
Y=95   cl1 nom1
Y=100  Mostaganem
Y=110  ← Espacement automatique (10 points)
Y=110  [TABLE HEADER] ← Position dynamique
```

## Logique de Calcul
1. **companyEndY** = Position finale des infos entreprise
2. **clientStartY** = max(companyEndY + 10, 85)
3. **tableStartY** = clientEndY + 10

## Résultat
✅ Espacement automatique qui s'adapte au contenu
✅ Aucun chevauchement possible
✅ Lisibilité optimale