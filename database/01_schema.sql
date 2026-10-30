-- =====================================================================
-- Ramdam : modèle physique de données (PostgreSQL 17)
-- Chaque contrainte renvoie à une règle de gestion (RG-xx) du dossier de conception.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------
CREATE TYPE role_utilisateur   AS ENUM ('ANIMATEUR', 'DIRECTEUR', 'ADMIN');
CREATE TYPE statut_compte      AS ENUM ('ACTIF', 'SUSPENDU');
CREATE TYPE type_fiche         AS ENUM ('JEU', 'GRAND_JEU', 'VEILLEE', 'MANUEL', 'SPORTIF', 'AUTRE');
CREATE TYPE statut_fiche       AS ENUM ('BROUILLON', 'PUBLIEE', 'MASQUEE');
CREATE TYPE statut_commentaire AS ENUM ('VISIBLE', 'MASQUE');
CREATE TYPE type_structure     AS ENUM ('ALSH', 'SEJOUR', 'PERISCOLAIRE', 'AUTRE');
CREATE TYPE statut_offre       AS ENUM ('OUVERTE', 'CLOTUREE');
CREATE TYPE statut_signalement AS ENUM ('EN_ATTENTE', 'TRAITE', 'IGNORE');
CREATE TYPE action_xp          AS ENUM ('FICHE_PUBLIEE', 'FICHE_EN_MALLE', 'FICHE_AIMEE', 'COMMENTAIRE_PUBLIE');

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
CREATE TABLE utilisateur (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             citext NOT NULL UNIQUE CHECK (length(email) <= 254),           -- RG-01
  mot_de_passe_hash text NOT NULL,
  pseudo            varchar(30) NOT NULL UNIQUE CHECK (pseudo ~ '^[A-Za-z0-9_.]{3,30}$'), -- RG-01
  bio               varchar(300),
  avatar_url        text,
  role              role_utilisateur NOT NULL DEFAULT 'ANIMATEUR',                  -- RG-02
  xp                integer NOT NULL DEFAULT 0 CHECK (xp >= 0),                     -- RG-17
  statut            statut_compte NOT NULL DEFAULT 'ACTIF',
  cgu_acceptees_le  timestamptz NOT NULL,                                           -- RG-03
  cree_le           timestamptz NOT NULL DEFAULT now(),
  modifie_le        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE jeton_rafraichissement (                                               -- RG-04
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id uuid NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
  jeton_hash     text NOT NULL UNIQUE,
  expire_le      timestamptz NOT NULL,
  revoque_le     timestamptz,
  cree_le        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fiche (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id           uuid NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE, -- RG-05, RG-06
  titre               varchar(120) NOT NULL CHECK (length(trim(titre)) > 0),
  type                type_fiche NOT NULL,
  age_min             smallint NOT NULL CHECK (age_min BETWEEN 3 AND 17),          -- RG-07
  age_max             smallint NOT NULL CHECK (age_max BETWEEN 3 AND 17),
  duree_minutes       smallint NOT NULL CHECK (duree_minutes BETWEEN 5 AND 1440),
  nb_participants_min smallint CHECK (nb_participants_min > 0),
  nb_participants_max smallint CHECK (nb_participants_max > 0),
  objectifs           text,
  materiel            text,
  deroulement         text NOT NULL CHECK (length(trim(deroulement)) > 0),
  image_url           text,
  statut              statut_fiche NOT NULL DEFAULT 'BROUILLON',
  publiee_le          timestamptz,
  cree_le             timestamptz NOT NULL DEFAULT now(),
  modifie_le          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fiche_ages_ck CHECK (age_min <= age_max),                             -- RG-07
  CONSTRAINT fiche_participants_ck CHECK (nb_participants_min <= nb_participants_max),
  CONSTRAINT fiche_publication_ck CHECK (statut = 'BROUILLON' OR publiee_le IS NOT NULL) -- RG-08
);

CREATE TABLE commentaire (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id   uuid NOT NULL REFERENCES fiche (id) ON DELETE CASCADE,                -- RG-09, RG-10
  auteur_id  uuid NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,          -- RG-05, RG-10
  parent_id  uuid REFERENCES commentaire (id) ON DELETE CASCADE,                   -- RG-11
  contenu    varchar(1000) NOT NULL CHECK (length(trim(contenu)) > 0),
  statut     statut_commentaire NOT NULL DEFAULT 'VISIBLE',
  cree_le    timestamptz NOT NULL DEFAULT now(),
  modifie_le timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commentaire_parent_ck CHECK (parent_id <> id)
);

CREATE TABLE aimer (                                                                -- RG-12
  utilisateur_id uuid NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
  fiche_id       uuid NOT NULL REFERENCES fiche (id) ON DELETE CASCADE,
  aime_le        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (utilisateur_id, fiche_id)
);

CREATE TABLE favori (                                                               -- RG-13, RG-14
  utilisateur_id uuid NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
  fiche_id       uuid NOT NULL REFERENCES fiche (id) ON DELETE CASCADE,
  ajoute_le      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (utilisateur_id, fiche_id)
);

CREATE TABLE offre (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directeur_id    uuid NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,     -- RG-05, RG-15
  intitule        varchar(120) NOT NULL,
  structure       varchar(120) NOT NULL,
  type_structure  type_structure NOT NULL,
  description     text NOT NULL,
  region          varchar(60) NOT NULL,
  date_debut      date NOT NULL,
  date_fin        date NOT NULL,
  diplome_requis  varchar(60),
  contact_externe varchar(255) NOT NULL,
  statut          statut_offre NOT NULL DEFAULT 'OUVERTE',
  cree_le         timestamptz NOT NULL DEFAULT now(),
  modifie_le      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offre_dates_ck CHECK (date_debut <= date_fin)                          -- RG-16
);

CREATE TABLE badge (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        varchar(40) NOT NULL UNIQUE,
  nom         varchar(60) NOT NULL,
  description varchar(255) NOT NULL,
  icone       varchar(40) NOT NULL
);

CREATE TABLE badge_obtenu (                                                         -- RG-19
  utilisateur_id uuid NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
  badge_id       uuid NOT NULL REFERENCES badge (id) ON DELETE CASCADE,
  obtenu_le      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (utilisateur_id, badge_id)
);

CREATE TABLE historique_xp (                                                        -- RG-17, RG-18
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  utilisateur_id uuid NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
  action         action_xp NOT NULL,
  points         smallint NOT NULL CHECK (points > 0),
  source_id      uuid NOT NULL,
  declencheur_id uuid NOT NULL,
  gagne_le       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT historique_xp_unique_gain UNIQUE (action, source_id, declencheur_id)
);

CREATE TABLE signalement (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id      uuid REFERENCES utilisateur (id) ON DELETE SET NULL,              -- RG-05
  admin_id       uuid REFERENCES utilisateur (id) ON DELETE SET NULL,
  fiche_id       uuid REFERENCES fiche (id) ON DELETE CASCADE,
  commentaire_id uuid REFERENCES commentaire (id) ON DELETE CASCADE,
  offre_id       uuid REFERENCES offre (id) ON DELETE CASCADE,
  motif          varchar(500) NOT NULL CHECK (length(trim(motif)) > 0),
  statut         statut_signalement NOT NULL DEFAULT 'EN_ATTENTE',
  cree_le        timestamptz NOT NULL DEFAULT now(),
  traite_le      timestamptz,
  CONSTRAINT signalement_cible_unique_ck
    CHECK (num_nonnulls(fiche_id, commentaire_id, offre_id) = 1),                  -- RG-20
  CONSTRAINT signalement_traitement_ck
    CHECK ((statut = 'EN_ATTENTE') = (traite_le IS NULL))
);

-- ---------------------------------------------------------------------
-- Index (clés étrangères et requêtes fréquentes ; éco-conception)
-- ---------------------------------------------------------------------
CREATE INDEX fiche_auteur_idx          ON fiche (auteur_id);
CREATE INDEX fiche_fil_idx             ON fiche (type, publiee_le DESC) WHERE statut = 'PUBLIEE';
CREATE INDEX commentaire_fiche_idx     ON commentaire (fiche_id, cree_le);
CREATE INDEX commentaire_auteur_idx    ON commentaire (auteur_id);
CREATE INDEX commentaire_parent_idx    ON commentaire (parent_id);
CREATE INDEX aimer_fiche_idx           ON aimer (fiche_id);
CREATE INDEX favori_fiche_idx          ON favori (fiche_id);
CREATE INDEX offre_liste_idx           ON offre (region, date_debut) WHERE statut = 'OUVERTE';
CREATE INDEX offre_directeur_idx       ON offre (directeur_id);
CREATE INDEX jeton_utilisateur_idx     ON jeton_rafraichissement (utilisateur_id);
CREATE INDEX historique_xp_user_idx    ON historique_xp (utilisateur_id, gagne_le DESC);
CREATE INDEX signalement_attente_idx   ON signalement (cree_le) WHERE statut = 'EN_ATTENTE';

-- ---------------------------------------------------------------------
-- Triggers : dates de modification
-- ---------------------------------------------------------------------
CREATE FUNCTION maj_modifie_le() RETURNS trigger AS $$
BEGIN
  NEW.modifie_le := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER utilisateur_modifie_le BEFORE UPDATE ON utilisateur FOR EACH ROW EXECUTE FUNCTION maj_modifie_le();
CREATE TRIGGER fiche_modifie_le       BEFORE UPDATE ON fiche       FOR EACH ROW EXECUTE FUNCTION maj_modifie_le();
CREATE TRIGGER commentaire_modifie_le BEFORE UPDATE ON commentaire FOR EACH ROW EXECUTE FUNCTION maj_modifie_le();
CREATE TRIGGER offre_modifie_le       BEFORE UPDATE ON offre       FOR EACH ROW EXECUTE FUNCTION maj_modifie_le();

-- ---------------------------------------------------------------------
-- Triggers : règles de gestion inter-tables
-- ---------------------------------------------------------------------

-- RG-15 : seul un directeur publie une offre (défense en profondeur, l'API vérifie aussi)
CREATE FUNCTION verifier_role_directeur() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM utilisateur WHERE id = NEW.directeur_id AND role = 'DIRECTEUR') THEN
    RAISE EXCEPTION 'RG-15 : seul un directeur peut publier une offre' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER offre_role_directeur BEFORE INSERT OR UPDATE OF directeur_id ON offre
  FOR EACH ROW EXECUTE FUNCTION verifier_role_directeur();

-- RG-14 : on ne met pas sa propre fiche en favori
CREATE FUNCTION verifier_favori() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM fiche WHERE id = NEW.fiche_id AND auteur_id = NEW.utilisateur_id) THEN
    RAISE EXCEPTION 'RG-14 : impossible de mettre sa propre fiche en favori' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER favori_pas_sa_fiche BEFORE INSERT ON favori
  FOR EACH ROW EXECUTE FUNCTION verifier_favori();

-- RG-11 : une réponse porte sur la même fiche que son commentaire parent
CREATE FUNCTION verifier_reponse() RETURNS trigger AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM commentaire WHERE id = NEW.parent_id AND fiche_id = NEW.fiche_id
  ) THEN
    RAISE EXCEPTION 'RG-11 : la réponse doit porter sur la même fiche que son parent' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commentaire_reponse BEFORE INSERT OR UPDATE OF parent_id, fiche_id ON commentaire
  FOR EACH ROW EXECUTE FUNCTION verifier_reponse();

-- ---------------------------------------------------------------------
-- Triggers : gamification (RG-17, RG-18)
-- ---------------------------------------------------------------------
CREATE FUNCTION attribuer_xp(p_beneficiaire uuid, p_action action_xp, p_points smallint,
                             p_source uuid, p_declencheur uuid) RETURNS void AS $$
BEGIN
  INSERT INTO historique_xp (utilisateur_id, action, points, source_id, declencheur_id)
  VALUES (p_beneficiaire, p_action, p_points, p_source, p_declencheur)
  ON CONFLICT ON CONSTRAINT historique_xp_unique_gain DO NOTHING;            -- RG-18

  IF FOUND THEN
    UPDATE utilisateur SET xp = xp + p_points WHERE id = p_beneficiaire;
  END IF;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER          -- s'exécute avec les droits du propriétaire : seul moyen d'écrire l'XP
   SET search_path = public;

CREATE FUNCTION xp_fiche_publiee() RETURNS trigger AS $$
BEGIN
  IF NEW.statut = 'PUBLIEE' AND (TG_OP = 'INSERT' OR OLD.statut = 'BROUILLON') THEN
    PERFORM attribuer_xp(NEW.auteur_id, 'FICHE_PUBLIEE', 50::smallint, NEW.id, NEW.auteur_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION xp_fiche_aimee() RETURNS trigger AS $$
DECLARE
  v_auteur uuid;
BEGIN
  SELECT auteur_id INTO v_auteur FROM fiche WHERE id = NEW.fiche_id;
  IF v_auteur <> NEW.utilisateur_id THEN                                        -- RG-05 (cahier) : pas d'XP sur soi-même
    PERFORM attribuer_xp(v_auteur, 'FICHE_AIMEE', 2::smallint, NEW.fiche_id, NEW.utilisateur_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION xp_fiche_en_malle() RETURNS trigger AS $$
BEGIN
  PERFORM attribuer_xp((SELECT auteur_id FROM fiche WHERE id = NEW.fiche_id),
                       'FICHE_EN_MALLE', 10::smallint, NEW.fiche_id, NEW.utilisateur_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION xp_commentaire() RETURNS trigger AS $$
BEGIN
  PERFORM attribuer_xp(NEW.auteur_id, 'COMMENTAIRE_PUBLIE', 5::smallint, NEW.id, NEW.auteur_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fiche_xp       AFTER INSERT OR UPDATE OF statut ON fiche FOR EACH ROW EXECUTE FUNCTION xp_fiche_publiee();
CREATE TRIGGER aimer_xp       AFTER INSERT ON aimer       FOR EACH ROW EXECUTE FUNCTION xp_fiche_aimee();
CREATE TRIGGER favori_xp      AFTER INSERT ON favori      FOR EACH ROW EXECUTE FUNCTION xp_fiche_en_malle();
CREATE TRIGGER commentaire_xp AFTER INSERT ON commentaire FOR EACH ROW EXECUTE FUNCTION xp_commentaire();

-- ---------------------------------------------------------------------
-- Sécurité : rôle applicatif aux droits minimaux
-- L'API se connecte avec ramdam_app : lecture et écriture des données,
-- aucun droit sur la structure (pas de DROP, ALTER, CREATE).
-- Le mot de passe est défini hors du script : ALTER ROLE ramdam_app PASSWORD '...';
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ramdam_app') THEN
    CREATE ROLE ramdam_app LOGIN;
  END IF;
END;
$$;

GRANT USAGE ON SCHEMA public TO ramdam_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ramdam_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ramdam_app;
-- L'XP ne s'écrit que par les triggers : l'API ne peut ni modifier l'historique ni le total.
REVOKE INSERT, UPDATE, DELETE ON historique_xp FROM ramdam_app;
REVOKE UPDATE ON utilisateur FROM ramdam_app;
GRANT UPDATE (email, mot_de_passe_hash, pseudo, bio, avatar_url, role, statut, cgu_acceptees_le)
  ON utilisateur TO ramdam_app;
REVOKE EXECUTE ON FUNCTION attribuer_xp(uuid, action_xp, smallint, uuid, uuid) FROM PUBLIC;
-- Les triggers d'XP s'exécutent avec les droits du propriétaire pour pouvoir appeler attribuer_xp.
ALTER FUNCTION xp_fiche_publiee()  SECURITY DEFINER SET search_path = public;
ALTER FUNCTION xp_fiche_aimee()    SECURITY DEFINER SET search_path = public;
ALTER FUNCTION xp_fiche_en_malle() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION xp_commentaire()    SECURITY DEFINER SET search_path = public;
