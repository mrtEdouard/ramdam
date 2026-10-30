-- =====================================================================
-- Ramdam : jeu d'essai
-- Identifiants fixes pour pouvoir écrire des tests reproductibles.
-- Les mots de passe sont des empreintes factices : la base de test ne
-- contient aucun vrai mot de passe.
-- =====================================================================

BEGIN;

-- Utilisateurs : 1 admin, 2 directeurs, 4 animateurs
INSERT INTO utilisateur (id, email, mot_de_passe_hash, pseudo, bio, role, cgu_acceptees_le) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@ramdam.test',   'hash-de-test', 'admin_ramdam', 'Équipe de modération', 'ADMIN',     now()),
  ('00000000-0000-0000-0000-000000000002', 'sophie@ramdam.test',  'hash-de-test', 'sophie.dir',   'Directrice ALSH',      'DIRECTEUR', now()),
  ('00000000-0000-0000-0000-000000000003', 'marc@ramdam.test',    'hash-de-test', 'marc_sejours', 'Directeur de séjours', 'DIRECTEUR', now()),
  ('00000000-0000-0000-0000-000000000004', 'lea@ramdam.test',     'hash-de-test', 'lea.anim',     'Stagiaire BAFA',       'ANIMATEUR', now()),
  ('00000000-0000-0000-0000-000000000005', 'karim@ramdam.test',   'hash-de-test', 'karim_gj',     'Fan de grands jeux',   'ANIMATEUR', now()),
  ('00000000-0000-0000-0000-000000000006', 'julie@ramdam.test',   'hash-de-test', 'julie.anim',   NULL,                   'ANIMATEUR', now()),
  ('00000000-0000-0000-0000-000000000007', 'tom@ramdam.test',     'hash-de-test', 'tom_bafa',     NULL,                   'ANIMATEUR', now());

-- Fiches : 6 publiées (tous les types), 1 brouillon, 1 masquée
INSERT INTO fiche (id, auteur_id, titre, type, age_min, age_max, duree_minutes, nb_participants_min, nb_participants_max, materiel, deroulement, statut, publiee_le) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'La chasse au trésor du capitaine', 'GRAND_JEU', 6, 10, 120, 12, 40, 'Cartes, coffre, foulards', 'Les équipes suivent les indices du capitaine jusqu''au coffre.', 'PUBLIEE', now() - interval '10 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 'Loup-garou sous les étoiles',      'VEILLEE',   8, 12, 60,  8,  20, 'Cartes rôles',             'Variante du loup-garou en extérieur à la lampe.',             'PUBLIEE', now() - interval '8 days'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Rallye nature',                    'JEU',       6, 12, 90,  6,  30, 'Fiches photos, crayons',   'Retrouver les éléments de la nature photographiés.',          'PUBLIEE', now() - interval '6 days'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', 'Impro express',                    'AUTRE',     10, 17, 45, 6,  16, NULL,                       'Scènes d''improvisation à partir de mots tirés au sort.',     'PUBLIEE', now() - interval '5 days'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'Cluedo géant',                     'GRAND_JEU', 9, 14, 150, 15, 50, 'Costumes, indices',        'Enquête grandeur nature dans tout le centre.',               'PUBLIEE', now() - interval '3 days'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'Fresque collective',               'MANUEL',    3, 6,  40,  4,  12, 'Rouleau papier, peinture', 'Chaque enfant ajoute un élément à une grande fresque.',         'PUBLIEE', now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004', 'Relais des saisons',               'SPORTIF',   6, 10, 30,  8,  24, 'Plots, ballons',           'Brouillon en cours de rédaction.',                            'BROUILLON', NULL),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000007', 'Fiche hors sujet',                 'AUTRE',     3, 17, 10,  NULL, NULL, NULL,                   'Contenu signalé puis masqué par un administrateur.',         'MASQUEE', now() - interval '2 days');

-- Commentaires, dont une réponse (RG-11)
INSERT INTO commentaire (id, fiche_id, auteur_id, parent_id, contenu) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', NULL, 'Testé avec mes 8-10 ans, gros succès !'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'Merci ! Pense à cacher le coffre loin du départ.'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', NULL, 'Super idée pour une dernière veillée.'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', NULL, 'Combien d''animateurs faut-il ?');

-- Likes et favoris (Malle)
INSERT INTO aimer (utilisateur_id, fiche_id) VALUES
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003');

INSERT INTO favori (utilisateur_id, fiche_id) VALUES
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001');

-- Offres : 2 ouvertes, 1 clôturée
INSERT INTO offre (id, directeur_id, intitule, structure, type_structure, description, region, date_debut, date_fin, diplome_requis, contact_externe, statut) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Animateur·rice accueil de loisirs', 'ALSH Les Lucioles', 'ALSH',   'Mercredis et vacances scolaires, 3-6 ans.', 'Occitanie', '2027-02-08', '2027-07-31', 'BAFA',   'recrutement@lucioles.test', 'OUVERTE'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Animateur·rice séjour montagne',   'Altitude Jeunes',   'SEJOUR', 'Séjour de 3 semaines, 8-14 ans.',           'Auvergne-Rhône-Alpes', '2027-07-05', '2027-07-26', 'BAFA', 'https://altitude-jeunes.test/recrutement', 'OUVERTE'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Animateur·rice séjour mer',        'Altitude Jeunes',   'SEJOUR', 'Séjour terminé.',                           'Bretagne', '2026-07-06', '2026-07-27', NULL, 'https://altitude-jeunes.test/recrutement', 'CLOTUREE');

-- Badges et obtentions
INSERT INTO badge (id, code, nom, description, icone) VALUES
  ('40000000-0000-0000-0000-000000000001', 'PREMIERE_FICHE', 'Première fiche',  'A publié sa première fiche',           'feather'),
  ('40000000-0000-0000-0000-000000000002', 'ROI_GRAND_JEU',  'Roi du grand jeu', 'A publié 5 grands jeux',              'crown'),
  ('40000000-0000-0000-0000-000000000003', 'MALLE_10',       'Malle pleine',     'Une de ses fiches est dans 10 Malles', 'trunk');

INSERT INTO badge_obtenu (utilisateur_id, badge_id) VALUES
  ('00000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001');

-- Signalements : 1 traité (fiche masquée), 1 en attente sur une offre
INSERT INTO signalement (auteur_id, admin_id, fiche_id, offre_id, motif, statut, traite_le) VALUES
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', NULL, 'Contenu sans rapport avec l''animation', 'TRAITE', now()),
  ('00000000-0000-0000-0000-000000000005', NULL, NULL, '30000000-0000-0000-0000-000000000002', 'Je doute qu''il s''agisse d''une vraie structure', 'EN_ATTENTE', NULL);

COMMIT;
