-- =====================================================================
-- Migration 006 : photos des offres
-- RG-27 : une offre peut montrer jusqu'à 6 photos du séjour ou de la structure,
--         supprimées avec elle. La première sert de vignette dans la liste.
-- =====================================================================

CREATE TABLE photo_offre (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offre_id   uuid NOT NULL REFERENCES offre (id) ON DELETE CASCADE,
  url        text NOT NULL,
  ajoutee_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX photo_offre_offre_idx ON photo_offre (offre_id, ajoutee_le);

-- RG-27 : l'API compte déjà les photos ; la base refuse aussi la 7e, quoi qu'il arrive.
CREATE FUNCTION limiter_photos_offre() RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM photo_offre WHERE offre_id = NEW.offre_id) >= 6 THEN
    RAISE EXCEPTION 'RG-27 : 6 photos au plus par offre' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_offre_limite
  BEFORE INSERT ON photo_offre
  FOR EACH ROW EXECUTE FUNCTION limiter_photos_offre();

GRANT SELECT, INSERT, DELETE ON photo_offre TO ramdam_app;
