# Routes API à Corriger - Next.js 16 Params

## ✅ Routes Déjà Corrigées
- `frontend/app/api/articles/[id]/route.ts` ✅
- `frontend/app/api/sales/delivery-notes/[id]/route.ts` ✅ (utilise déjà await params)
- `frontend/app/api/sales/delivery-notes/[id]/edit/route.ts` ✅ (utilise déjà await params)
- `frontend/app/api/sales/proforma/[id]/route.ts` ✅ (utilise déjà await params)
- `frontend/app/api/pdf/proforma/[id]/route.ts` ✅ (utilise déjà await params)
- `frontend/app/api/auth-real/validate-reset-token/[token]/route.ts` ✅ (utilise déjà await params)

## ❌ Routes à Vérifier/Corriger

Basé sur la structure, voici les routes potentielles avec [id]:

1. `frontend/app/api/admin/users/[id]/route.ts` - Si existe
2. `frontend/app/api/payments/[id]/route.ts` - Si existe
3. `frontend/app/api/sales/invoices/[id]/route.ts` - Si existe
4. `frontend/app/api/pdf/invoice/[id]/route.ts` - Si existe
5. `frontend/app/api/pdf/delivery-note/[id]/route.ts` - Si existe
6. `frontend/app/api/pdf/delivery-note-small/[id]/route.ts` - Si existe
7. `frontend/app/api/pdf/delivery-note-ticket/[id]/route.ts` - Si existe
8. `frontend/app/api/pdf/debug-bl/[id]/route.ts` - Si existe

## 📝 Pattern de Correction

**AVANT (❌ Ne fonctionne pas):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id; // ❌ params.id est undefined
}
```

**APRÈS (✅ Fonctionne):**
```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id; // ✅ params.id contient la vraie valeur
}
```

## 🎯 Résultat

Toutes les routes API avec paramètres dynamiques doivent utiliser `await params` pour Next.js 15+.
