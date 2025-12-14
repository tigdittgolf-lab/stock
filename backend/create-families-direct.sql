-- Créer les familles directement dans la table 2025_bu01.famille_art
-- Exécutez ce script dans Supabase SQL Editor

-- Insérer les familles de base (ignorer si elles existent déjà)
INSERT INTO "2025_bu01".famille_art (famille) 
VALUES 
    ('Electricité'),
    ('Droguerie'),
    ('Peinture'),
    ('Outillage'),
    ('Plomberie'),
    ('Carrelage'),
    ('Informatique'),
    ('Automobile'),
    ('Jardinage'),
    ('Sécurité')
ON CONFLICT (famille) DO NOTHING;

-- Vérifier que les familles ont été créées
SELECT * FROM "2025_bu01".famille_art ORDER BY famille;