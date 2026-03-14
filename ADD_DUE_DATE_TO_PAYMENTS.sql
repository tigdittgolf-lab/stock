-- Ajouter la colonne due_date à la table payments
-- Pour Supabase (PostgreSQL)

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Index pour améliorer les performances des requêtes sur les échéances
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);

-- Index simple sans prédicat WHERE (pour éviter l'erreur IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_payments_tenant_due ON public.payments(tenant_id, due_date);

-- Commentaire
COMMENT ON COLUMN public.payments.due_date IS 'Date d''échéance du paiement (optionnel)';
