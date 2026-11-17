-- =====================================================================
-- Migration 008 : signalements et modération
-- RG-20 (déjà dans le schéma) : un signalement vise une seule chose : fiche, commentaire ou offre.
-- RG-28 : on ne signale pas deux fois le même contenu tant que le premier signalement attend.
-- RG-29 : l'administrateur masque le contenu signalé (il disparaît pour tous, sauf son auteur)
--         ou ignore le signalement ; tous les signalements en attente sur ce contenu sont clos.
-- =====================================================================

-- Une offre peut maintenant être masquée par la modération, comme une fiche ou un commentaire.
ALTER TYPE statut_offre ADD VALUE 'MASQUEE';

-- RG-28 : un seul signalement en attente par personne et par contenu.
-- COALESCE prend l'identifiant non nul (RG-20 garantit qu'il y en a exactement un).
CREATE UNIQUE INDEX signalement_unique_en_attente
  ON signalement (auteur_id, COALESCE(fiche_id, commentaire_id, offre_id))
  WHERE statut = 'EN_ATTENTE';
