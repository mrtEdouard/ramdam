-- =====================================================================
-- Migration 002 : la base travaille en heure universelle (UTC)
-- Prisma (adaptateur pg) envoie les dates sans fuseau horaire : sur un serveur réglé à l'heure
-- de Berlin, PostgreSQL les lisait comme des heures locales et les décalait d'une heure.
-- En UTC, la date envoyée et la date enregistrée sont identiques ; l'app affiche ensuite
-- l'heure locale de chacun.
-- =====================================================================
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'UTC');
END;
$$;
