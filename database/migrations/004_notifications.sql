-- =====================================================================
-- Migration 004 : notifications
-- RG-24 : l'auteur d'une fiche est prévenu quand quelqu'un l'aime ou la garde dans sa Malle.
-- Les notifications sont créées par des triggers, comme l'XP : elles ne peuvent pas être oubliées
-- par l'API, qui n'a d'ailleurs pas le droit d'en créer (seulement de les lire et de les marquer lues).
-- =====================================================================
CREATE TYPE type_notification AS ENUM ('FICHE_AIMEE', 'FICHE_EN_MALLE');

CREATE TABLE notification (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinataire_id uuid NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
  acteur_id      uuid NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
  type           type_notification NOT NULL,
  fiche_id       uuid NOT NULL REFERENCES fiche (id) ON DELETE CASCADE,
  lue_le         timestamptz,
  cree_le        timestamptz NOT NULL DEFAULT now(),
  -- Une seule notification par personne, par fiche et par type : aimer, retirer puis
  -- ré-aimer ne bombarde pas l'auteur de notifications.
  CONSTRAINT notification_unique UNIQUE (type, acteur_id, fiche_id)
);
CREATE INDEX notification_destinataire_idx ON notification (destinataire_id, cree_le DESC);

CREATE FUNCTION notifier_auteur() RETURNS trigger AS $$
DECLARE
  v_auteur uuid;
BEGIN
  SELECT auteur_id INTO v_auteur FROM fiche WHERE id = NEW.fiche_id;
  IF v_auteur <> NEW.utilisateur_id THEN
    INSERT INTO notification (destinataire_id, acteur_id, type, fiche_id)
    VALUES (v_auteur, NEW.utilisateur_id,
            CASE TG_TABLE_NAME WHEN 'aimer' THEN 'FICHE_AIMEE' ELSE 'FICHE_EN_MALLE' END::type_notification,
            NEW.fiche_id)
    ON CONFLICT ON CONSTRAINT notification_unique DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER aimer_notification  AFTER INSERT ON aimer  FOR EACH ROW EXECUTE FUNCTION notifier_auteur();
CREATE TRIGGER favori_notification AFTER INSERT ON favori FOR EACH ROW EXECUTE FUNCTION notifier_auteur();

-- Moindre privilège : l'API lit, supprime et marque comme lues ; seul le trigger crée.
GRANT SELECT, DELETE ON notification TO ramdam_app;
GRANT UPDATE (lue_le) ON notification TO ramdam_app;
