-- =====================================================================
-- Migration 001 : fiches enrichies
-- - matériel et objectifs deviennent des listes de mots-clés (bulles dans l'app)
-- - le type « Autre » porte un nom choisi par l'auteur (RG-21)
-- - une couverture et une galerie de photos par fiche (RG-22)
-- =====================================================================

-- Les textes existants « Cartes, coffre, foulards » deviennent {Cartes, coffre, foulards}.
ALTER TABLE fiche
  ALTER COLUMN materiel TYPE text[] USING COALESCE(string_to_array(materiel, ', '), '{}'),
  ALTER COLUMN materiel SET DEFAULT '{}',
  ALTER COLUMN materiel SET NOT NULL,
  ALTER COLUMN objectifs TYPE text[] USING COALESCE(string_to_array(objectifs, ', '), '{}'),
  ALTER COLUMN objectifs SET DEFAULT '{}',
  ALTER COLUMN objectifs SET NOT NULL,
  ADD CONSTRAINT fiche_materiel_ck CHECK (cardinality(materiel) <= 30),
  ADD CONSTRAINT fiche_objectifs_ck CHECK (cardinality(objectifs) <= 15);

-- RG-21 : une fiche de type AUTRE a toujours un nom de type, et les autres types n'en ont pas.
ALTER TABLE fiche ADD COLUMN type_personnalise varchar(40)
  CHECK (length(trim(type_personnalise)) > 0);
UPDATE fiche SET type_personnalise = 'Autre' WHERE type = 'AUTRE';
ALTER TABLE fiche ADD CONSTRAINT fiche_type_personnalise_ck
  CHECK ((type = 'AUTRE') = (type_personnalise IS NOT NULL));

-- RG-22 : galerie de photos d'une fiche, supprimée avec elle. La couverture reste fiche.image_url.
CREATE TABLE photo_fiche (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id   uuid NOT NULL REFERENCES fiche (id) ON DELETE CASCADE,
  url        text NOT NULL,
  ajoutee_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX photo_fiche_fiche_idx ON photo_fiche (fiche_id, ajoutee_le);

GRANT SELECT, INSERT, DELETE ON photo_fiche TO ramdam_app;
