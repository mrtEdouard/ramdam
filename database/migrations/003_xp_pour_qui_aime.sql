-- =====================================================================
-- Migration 003 : RG-23, aimer la fiche d'un autre rapporte +1 XP
-- Une seule fois par fiche (contrainte historique_xp_unique_gain, RG-18)
-- et 10 fois par jour au plus : aimer tout et n'importe quoi ne fait pas monter de niveau.
-- =====================================================================
ALTER TYPE action_xp ADD VALUE IF NOT EXISTS 'FICHE_AIMEE_DONNEE';

CREATE OR REPLACE FUNCTION xp_fiche_aimee() RETURNS trigger AS $$
DECLARE
  v_auteur        uuid;
  v_gains_du_jour integer;
BEGIN
  SELECT auteur_id INTO v_auteur FROM fiche WHERE id = NEW.fiche_id;
  IF v_auteur <> NEW.utilisateur_id THEN                                        -- pas d'XP sur soi-même
    -- +2 XP pour l'auteur de la fiche aimée.
    PERFORM attribuer_xp(v_auteur, 'FICHE_AIMEE', 2::smallint, NEW.fiche_id, NEW.utilisateur_id);

    -- RG-23 : +1 XP pour celui qui aime, tant qu'il n'a pas déjà gagné 10 fois aujourd'hui.
    SELECT count(*) INTO v_gains_du_jour
    FROM historique_xp
    WHERE utilisateur_id = NEW.utilisateur_id
      AND action = 'FICHE_AIMEE_DONNEE'
      AND gagne_le >= date_trunc('day', now());
    IF v_gains_du_jour < 10 THEN
      PERFORM attribuer_xp(NEW.utilisateur_id, 'FICHE_AIMEE_DONNEE', 1::smallint,
                           NEW.fiche_id, NEW.utilisateur_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CREATE OR REPLACE remet les droits par défaut : la fonction doit garder les droits de son
-- propriétaire pour écrire l'XP, que l'API (ramdam_app) n'a pas le droit de modifier.
ALTER FUNCTION xp_fiche_aimee() SECURITY DEFINER SET search_path = public;
