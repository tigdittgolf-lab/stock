-- Créer les familles de base dans le schéma 2025_bu01
-- Exécutez ce script dans Supabase SQL Editor

-- Insérer les familles de base (ignorer si elles existent déjà)
INSERT INTO "2025_bu01".famille_art (famille) 
VALUES 
    ('Electricité'),
    ('Droguerie'),
    ('Peinture'),
    ('Outillage'),
    ('Plomberie'),
    ('Carrelage')
ON CONFLICT (famille) DO NOTHING;