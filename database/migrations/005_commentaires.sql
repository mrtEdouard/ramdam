-- =====================================================================
-- Migration 005 : commentaires et réponses
-- RG-11 : une réponse porte sur la même fiche que son parent, et on ne répond qu'à un
--         commentaire, pas à une réponse (un seul niveau, comme sur Instagram).
-- RG-25 : commenter la fiche d'un autre rapporte +5 XP, une seule fois par fiche
--         (sinon on pourrait gagner de l'XP en postant des dizaines de commentaires).
-- RG-26 : l'auteur de la fiche est prévenu d'un commentaire, l'auteur d'un commentaire
--         est prévenu d'une réponse.
-- =====================================================================

-- RG-11 : on refuse aussi la réponse à une réponse.
CREATE OR REPLACE FUNCTION verifier_reponse() RETURNS trigger AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM commentaire
    WHERE id = NEW.parent_id AND fiche_id = NEW.fiche_id AND parent_id IS NULL
  ) THEN
    RAISE EXCEPTION 'RG-11 : on répond à un commentaire de la même fiche, pas à une réponse'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RG-25 : la source du gain devient la fiche (et non plus le commentaire) ; la contrainte
-- historique_xp_unique_gain (action, source, déclencheur) empêche alors un 2e gain sur la même fiche.
CREATE OR REPLACE FUNCTION xp_commentaire() RETURNS trigger AS $$
BEGIN
  IF (SELECT auteur_id FROM fiche WHERE id = NEW.fiche_id) <> NEW.auteur_id THEN
    PERFORM attribuer_xp(NEW.auteur_id, 'COMMENTAIRE_PUBLIE', 5::smallint, NEW.fiche_id, NEW.auteur_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
ALTER FUNCTION xp_commentaire() SECURITY DEFINER SET search_path = public;

-- RG-26 : deux nouveaux types de notification.
ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'COMMENTAIRE';
ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'REPONSE';

-- La même personne peut répondre à deux personnes différentes sous une même fiche :
-- le destinataire entre donc dans la règle d'unicité (pour les « j'aime », rien ne change,
-- le destinataire est toujours l'auteur de la fiche).
ALTER TABLE notification DROP CONSTRAINT notification_unique;
ALTER TABLE notification
  ADD CONSTRAINT notification_unique UNIQUE (type, acteur_id, fiche_id, destinataire_id);

CREATE OR REPLACE FUNCTION notifier_commentaire() RETURNS trigger AS $$
DECLARE
  v_destinataire uuid;
  v_type         text;
BEGIN
  IF NEW.parent_id IS NULL THEN
    SELECT auteur_id INTO v_destinataire FROM fiche WHERE id = NEW.fiche_id;
    v_type := 'COMMENTAIRE';
  ELSE
    SELECT auteur_id INTO v_destinataire FROM commentaire WHERE id = NEW.parent_id;
    v_type := 'REPONSE';
  END IF;

  -- On ne se notifie pas soi-même.
  IF v_destinataire <> NEW.auteur_id THEN
    INSERT INTO notification (destinataire_id, acteur_id, type, fiche_id)
    VALUES (v_destinataire, NEW.auteur_id, v_type::type_notification, NEW.fiche_id)
    -- Une notification par personne, fiche et type (RG-24) : un nouveau commentaire
    -- la fait simplement remonter en haut de la liste, comme non lue.
    ON CONFLICT ON CONSTRAINT notification_unique
      DO UPDATE SET cree_le = now(), lue_le = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER commentaire_notification AFTER INSERT ON commentaire
  FOR EACH ROW EXECUTE FUNCTION notifier_commentaire();
