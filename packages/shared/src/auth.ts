import { z } from 'zod';

// Recommandation CNIL : 12 caractères minimum avec majuscule, minuscule, chiffre et caractère spécial.
// Les règles sont exportées pour que l'app affiche la liste à cocher sous le champ.
export const reglesMotDePasse = [
  { libelle: 'au moins 12 caractères', regex: /.{12,}/ },
  { libelle: 'une minuscule', regex: /[a-z]/ },
  { libelle: 'une majuscule', regex: /[A-Z]/ },
  { libelle: 'un chiffre', regex: /[0-9]/ },
  { libelle: 'un caractère spécial', regex: /[^A-Za-z0-9]/ },
];

let motDePasseSchema = z
  .string()
  // La limite haute évite qu'un mot de passe géant ralentisse volontairement le hachage Argon2.
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères');
for (const regle of reglesMotDePasse) {
  motDePasseSchema = motDePasseSchema.regex(
    regle.regex,
    `Le mot de passe doit contenir ${regle.libelle}`,
  );
}

export const inscriptionSchema = z.object({
  email: z.email('Adresse e-mail invalide').max(254),
  // RG-01 : mêmes règles que la contrainte CHECK de la table utilisateur.
  pseudo: z
    .string()
    .regex(
      /^[A-Za-z0-9_.]{3,30}$/,
      'Le pseudo doit faire 3 à 30 caractères : lettres, chiffres, point ou tiret bas',
    ),
  motDePasse: motDePasseSchema,
  // RG-02 : le rôle Directeur est déclaratif, ADMIN ne peut pas être choisi à l'inscription.
  role: z.enum(['ANIMATEUR', 'DIRECTEUR'], 'Le rôle doit être ANIMATEUR ou DIRECTEUR'),
  // RG-03 : les CGU doivent être acceptées pour créer un compte.
  cguAcceptees: z.literal(true, 'Tu dois accepter les conditions générales'),
});

export const connexionSchema = z.object({
  email: z.email('Adresse e-mail invalide'),
  motDePasse: z.string().min(1, 'Mot de passe requis').max(128),
});

export type InscriptionDto = z.infer<typeof inscriptionSchema>;
export type ConnexionDto = z.infer<typeof connexionSchema>;

// Ce que l'API renvoie après une inscription ou une connexion réussie.
export type Session = {
  jeton: string;
  utilisateur: {
    id: string;
    pseudo: string;
    role: 'ANIMATEUR' | 'DIRECTEUR' | 'ADMIN';
    xp: number;
  };
};
