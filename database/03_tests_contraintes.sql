-- =====================================================================
-- Ramdam : tests des contraintes (à lancer sur le jeu d'essai)
-- Chaque bloc tente une opération interdite et doit afficher « OK ».
-- Tout s'exécute dans une transaction annulée : la base reste intacte.
-- =====================================================================

\set ON_ERROR_STOP on
BEGIN;

-- Fonction d'aide : exécute une requête qui DOIT échouer
CREATE FUNCTION pg_temp.doit_echouer(p_regle text, p_sql text) RETURNS void AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION 'ÉCHEC % : la requête aurait dû être refusée', p_regle;
EXCEPTION
  WHEN unique_violation OR check_violation OR foreign_key_violation
       OR not_null_violation OR insufficient_privilege THEN
    RAISE NOTICE 'OK % (%)', p_regle, SQLERRM;
END;
$$ LANGUAGE plpgsql;

SELECT pg_temp.doit_echouer('RG-01 email unique (casse ignorée)',
  $q$INSERT INTO utilisateur (email, mot_de_passe_hash, pseudo, cgu_acceptees_le)
     VALUES ('LEA@ramdam.test', 'x', 'autre_lea', now())$q$);

SELECT pg_temp.doit_echouer('RG-01 format du pseudo',
  $q$INSERT INTO utilisateur (email, mot_de_passe_hash, pseudo, cgu_acceptees_le)
     VALUES ('x@ramdam.test', 'x', 'a b', now())$q$);

SELECT pg_temp.doit_echouer('RG-07 âge minimum > âge maximum',
  $q$INSERT INTO fiche (auteur_id, titre, type, age_min, age_max, duree_minutes, deroulement)
     VALUES ('00000000-0000-0000-0000-000000000004', 'Test', 'JEU', 12, 6, 30, 'x')$q$);

SELECT pg_temp.doit_echouer('RG-08 fiche publiée sans date de publication',
  $q$INSERT INTO fiche (auteur_id, titre, type, age_min, age_max, duree_minutes, deroulement, statut)
     VALUES ('00000000-0000-0000-0000-000000000004', 'Test', 'JEU', 6, 12, 30, 'x', 'PUBLIEE')$q$);

SELECT pg_temp.doit_echouer('RG-11 réponse sur une autre fiche que son parent',
  $q$INSERT INTO commentaire (fiche_id, auteur_id, parent_id, contenu)
     VALUES ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004',
             '20000000-0000-0000-0000-000000000001', 'x')$q$);

SELECT pg_temp.doit_echouer('RG-12 aimer deux fois la même fiche',
  $q$INSERT INTO aimer (utilisateur_id, fiche_id)
     VALUES ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001')$q$);

SELECT pg_temp.doit_echouer('RG-14 mettre sa propre fiche en favori',
  $q$INSERT INTO favori (utilisateur_id, fiche_id)
     VALUES ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001')$q$);

SELECT pg_temp.doit_echouer('RG-15 offre publiée par un animateur',
  $q$INSERT INTO offre (directeur_id, intitule, structure, type_structure, description, region,
                        date_debut, date_fin, contact_externe)
     VALUES ('00000000-0000-0000-0000-000000000004', 'x', 'x', 'ALSH', 'x', 'x',
             '2027-01-01', '2027-01-31', 'x')$q$);

SELECT pg_temp.doit_echouer('RG-16 date de début après la date de fin',
  $q$INSERT INTO offre (directeur_id, intitule, structure, type_structure, description, region,
                        date_debut, date_fin, contact_externe)
     VALUES ('00000000-0000-0000-0000-000000000002', 'x', 'x', 'ALSH', 'x', 'x',
             '2027-03-01', '2027-01-31', 'x')$q$);

SELECT pg_temp.doit_echouer('RG-20 signalement visant deux cibles',
  $q$INSERT INTO signalement (auteur_id, fiche_id, offre_id, motif)
     VALUES ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001',
             '30000000-0000-0000-0000-000000000001', 'x')$q$);

-- RG-17 et RG-18 : XP attribuée une seule fois, même après un like retiré puis remis
DO $$
DECLARE
  avant integer;
  apres integer;
BEGIN
  SELECT xp INTO avant FROM utilisateur WHERE id = '00000000-0000-0000-0000-000000000005';
  DELETE FROM aimer WHERE utilisateur_id = '00000000-0000-0000-0000-000000000004'
                      AND fiche_id = '10000000-0000-0000-0000-000000000001';
  INSERT INTO aimer (utilisateur_id, fiche_id)
  VALUES ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001');
  SELECT xp INTO apres FROM utilisateur WHERE id = '00000000-0000-0000-0000-000000000005';
  IF avant <> apres THEN
    RAISE EXCEPTION 'ÉCHEC RG-18 : XP passée de % à %', avant, apres;
  END IF;
  RAISE NOTICE 'OK RG-18 like retiré puis remis : XP inchangée (%)', apres;
END;
$$;

-- RG-17 : le total d'XP est égal à la somme de l'historique
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM utilisateur u
    WHERE u.xp <> (SELECT coalesce(sum(points), 0) FROM historique_xp h WHERE h.utilisateur_id = u.id)
  ) THEN
    RAISE EXCEPTION 'ÉCHEC RG-17 : total XP incohérent';
  END IF;
  RAISE NOTICE 'OK RG-17 total XP = somme de l''historique';
END;
$$;

-- RG-09 : supprimer une fiche supprime ses commentaires, likes et favoris
DO $$
BEGIN
  DELETE FROM fiche WHERE id = '10000000-0000-0000-0000-000000000001';
  IF EXISTS (SELECT 1 FROM commentaire WHERE fiche_id = '10000000-0000-0000-0000-000000000001')
     OR EXISTS (SELECT 1 FROM aimer WHERE fiche_id = '10000000-0000-0000-0000-000000000001')
     OR EXISTS (SELECT 1 FROM favori WHERE fiche_id = '10000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'ÉCHEC RG-09 : suppression en cascade incomplète';
  END IF;
  RAISE NOTICE 'OK RG-09 suppression en cascade';
END;
$$;

-- Sécurité : le rôle applicatif ne peut pas modifier l'XP lui-même
SET LOCAL ROLE ramdam_app;
SELECT pg_temp.doit_echouer('Sécurité : ramdam_app modifie le total d''XP',
  $q$UPDATE utilisateur SET xp = 99999 WHERE id = '00000000-0000-0000-0000-000000000004'$q$);
SELECT pg_temp.doit_echouer('Sécurité : ramdam_app écrit dans l''historique XP',
  $q$INSERT INTO historique_xp (utilisateur_id, action, points, source_id, declencheur_id)
     VALUES ('00000000-0000-0000-0000-000000000004', 'FICHE_PUBLIEE', 500,
             gen_random_uuid(), gen_random_uuid())$q$);

-- Et l'XP continue d'être attribuée par les triggers quand l'API agit
DO $$
DECLARE
  avant integer;
  apres integer;
BEGIN
  SELECT xp INTO avant FROM utilisateur WHERE id = '00000000-0000-0000-0000-000000000006';
  INSERT INTO favori (utilisateur_id, fiche_id)
  VALUES ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006');
  SELECT xp INTO apres FROM utilisateur WHERE id = '00000000-0000-0000-0000-000000000006';
  IF apres <> avant + 10 THEN
    RAISE EXCEPTION 'ÉCHEC : XP attendue %, obtenue %', avant + 10, apres;
  END IF;
  RAISE NOTICE 'OK triggers XP fonctionnels avec ramdam_app (+10 XP)';
END;
$$;
RESET ROLE;

ROLLBACK;
