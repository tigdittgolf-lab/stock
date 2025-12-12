-- 1. Nettoyage des données orphelines pour Articles -> Fournisseurs
-- On crée les fournisseurs manquants pour éviter de supprimer des articles
INSERT INTO fournisseur (nfournisseur, nom_fournisseur)
SELECT DISTINCT a.nfournisseur, 'Fournisseur Reconstitué'
FROM article a
LEFT JOIN fournisseur f ON a.nfournisseur = f.nfournisseur
WHERE f.nfournisseur IS NULL;

-- 2. Nettoyage des données orphelines pour Articles -> Familles
-- On crée les familles manquantes
INSERT INTO famille_art (famille)
SELECT DISTINCT a.famille
FROM article a
LEFT JOIN famille_art f ON a.famille = f.famille
WHERE f.famille IS NULL;

-- 3. Nettoyage des données orphelines pour Bachat -> Fournisseurs (si bachat existe)
INSERT INTO fournisseur (nfournisseur, nom_fournisseur)
SELECT DISTINCT b.nfournisseur, 'Fournisseur Reconstitué (Achat)'
FROM bachat b
LEFT JOIN fournisseur f ON b.nfournisseur = f.nfournisseur
WHERE f.nfournisseur IS NULL;

-- 4. Maintenant qu'on a nettoyé, on peut appliquer les contraintes de clés étrangères (FK)

-- Article -> Famille
ALTER TABLE article DROP CONSTRAINT IF EXISTS article_famille_fkey;
ALTER TABLE article ADD CONSTRAINT article_famille_fkey FOREIGN KEY (famille) REFERENCES famille_art(famille);

-- Article -> Fournisseur
ALTER TABLE article DROP CONSTRAINT IF EXISTS article_fournisseur_fkey;
ALTER TABLE article ADD CONSTRAINT article_fournisseur_fkey FOREIGN KEY (nfournisseur) REFERENCES fournisseur(nfournisseur);

-- Bachat -> Bachat Detail (S'assurer que les tables sont bien liées)
ALTER TABLE bachat_detail DROP CONSTRAINT IF EXISTS bachat_detail_nfact_fkey;
ALTER TABLE bachat_detail ADD CONSTRAINT bachat_detail_nfact_fkey FOREIGN KEY (nfact) REFERENCES bachat(nfact) ON DELETE CASCADE;

ALTER TABLE bachat_detail DROP CONSTRAINT IF EXISTS bachat_detail_narticle_fkey;
ALTER TABLE bachat_detail ADD CONSTRAINT bachat_detail_narticle_fkey FOREIGN KEY (narticle) REFERENCES article(narticle);

-- Bachat -> Fournisseur
ALTER TABLE bachat DROP CONSTRAINT IF EXISTS bachat_nfournisseur_fkey;
ALTER TABLE bachat ADD CONSTRAINT bachat_nfournisseur_fkey FOREIGN KEY (nfournisseur) REFERENCES fournisseur(nfournisseur);

-- 5. Force Refresh du cache Schema de Supabase
NOTIFY pgrst, 'reload config';
