-- =====================================================================
-- Migration 007 : la ville de l'offre
-- La région seule est trop vague pour un animateur (« Occitanie », c'est grand) :
-- chaque offre indique aussi sa ville, obligatoire.
-- =====================================================================

ALTER TABLE offre ADD COLUMN ville varchar(80);

-- Les offres déjà publiées n'ont pas de ville : le Directeur pourra la corriger en modifiant l'offre.
UPDATE offre SET ville = 'À préciser';

ALTER TABLE offre
  ALTER COLUMN ville SET NOT NULL,
  ADD CONSTRAINT offre_ville_ck CHECK (length(trim(ville)) >= 2);
