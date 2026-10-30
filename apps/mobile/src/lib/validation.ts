import type { ZodType } from 'zod';

// Valide le formulaire avec le même schéma Zod que l'API et renvoie
// le premier message d'erreur de chaque champ : { email: '...', pseudo: '...' }.
export function erreursDuFormulaire(schema: ZodType, valeurs: unknown) {
  const resultat = schema.safeParse(valeurs);
  const erreurs: Record<string, string> = {};
  if (!resultat.success) {
    for (const issue of resultat.error.issues) {
      erreurs[String(issue.path[0])] ??= issue.message;
    }
  }
  return erreurs;
}
