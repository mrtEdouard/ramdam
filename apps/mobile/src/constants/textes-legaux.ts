// Textes des pages légales (mentions légales, CGU, politique de confidentialité).
// Ils sont écrits ici, à un seul endroit ; l'écran PageLegale se contente de les afficher.
// Une ligne qui commence par « – » est affichée comme un élément de liste.

export type Section = { titre: string; paragraphes: string[] };
export type PageLegale = { titre: string; miseAJour: string; intro: string; sections: Section[] };

const CONTACT = 'mouret.edouard34000@gmail.com';
const MISE_A_JOUR = '23 novembre 2026';

export const mentionsLegales: PageLegale = {
  titre: 'Mentions légales',
  miseAJour: MISE_A_JOUR,
  intro:
    'Ramdam est un réseau social pour les animateurs : partage de fiches d’activité et offres de recrutement. C’est un projet personnel, réalisé dans le cadre d’une formation de concepteur développeur d’applications.',
  sections: [
    {
      titre: 'Éditeur',
      paragraphes: [
        'Edouard Mouret, particulier.',
        `Contact : ${CONTACT}`,
        'Directeur de la publication : Edouard Mouret.',
      ],
    },
    {
      titre: 'Hébergeur',
      paragraphes: [
        'netcup GmbH, Daimlerstraße 25, 76185 Karlsruhe, Allemagne.',
        'Téléphone : +49 721 7540755-0.',
      ],
    },
    {
      titre: 'Propriété intellectuelle',
      paragraphes: [
        'Le code, le logo et la charte graphique de Ramdam appartiennent à leur auteur.',
        'Les fiches, offres, photos et commentaires appartiennent à ceux qui les publient (voir les conditions d’utilisation).',
        '– Photos d’illustration : Wikimedia Commons, sous licences libres (auteurs crédités dans le code source).',
        '– Contours des régions : Admin Express, IGN, Licence ouverte Etalab.',
        '– Communes proposées dans les offres : API Géo de l’État (geo.api.gouv.fr).',
      ],
    },
    {
      titre: 'Signaler un contenu illicite',
      paragraphes: [
        `Utilisez le bouton « Signaler » sous la fiche, le commentaire ou l’offre concerné, ou écrivez à ${CONTACT}.`,
      ],
    },
  ],
};

export const conditionsUtilisation: PageLegale = {
  titre: 'Conditions d’utilisation',
  miseAJour: MISE_A_JOUR,
  intro:
    'Ces conditions s’appliquent à toute personne qui crée un compte sur Ramdam. Les accepter est nécessaire pour s’inscrire.',
  sections: [
    {
      titre: '1. Le service',
      paragraphes: [
        'Ramdam permet de publier et de retrouver des fiches d’activité, de les aimer, de les commenter et de les garder dans sa galerie, et, pour les directeurs, de publier des offres de recrutement. Le service est gratuit.',
      ],
    },
    {
      titre: '2. Inscription et compte',
      paragraphes: [
        '– Il faut avoir au moins 15 ans pour s’inscrire.',
        '– Les informations données doivent être exactes ; un compte est personnel.',
        '– Le mot de passe est confidentiel : vous êtes responsable de ce qui est fait avec votre compte.',
      ],
    },
    {
      titre: '3. Le rôle Directeur',
      paragraphes: [
        'Le rôle Directeur se choisit à l’inscription, sur déclaration. Ramdam ne vérifie pas les diplômes ni l’identité des structures. Avant de candidater, vérifiez l’offre auprès de la structure : la candidature se fait en dehors de Ramdam.',
      ],
    },
    {
      titre: '4. Ce que vous publiez',
      paragraphes: [
        'Vous restez propriétaire de vos contenus et responsable de ce que vous publiez. En publiant, vous autorisez Ramdam à les afficher aux autres membres, tant qu’ils restent en ligne. Vous pouvez les supprimer à tout moment.',
        'Il est interdit de publier :',
        '– un contenu illégal, haineux, violent ou à caractère sexuel ;',
        '– des insultes, du harcèlement ou des propos discriminatoires ;',
        '– une photo où un enfant est reconnaissable sans l’accord écrit de ses parents ;',
        '– des informations personnelles sur d’autres personnes ;',
        '– de la publicité, du spam ou une fausse offre d’emploi ;',
        '– un contenu qui ne vous appartient pas sans l’accord de son auteur.',
      ],
    },
    {
      titre: '5. Modération',
      paragraphes: [
        'Chacun peut signaler un contenu. Un administrateur peut alors le masquer, et suspendre un compte qui ne respecte pas ces conditions.',
      ],
    },
    {
      titre: '6. XP et niveaux',
      paragraphes: [
        'L’XP et les niveaux récompensent la participation. Ils n’ont aucune valeur marchande et leurs règles peuvent évoluer. Les gains obtenus en contournant les règles peuvent être retirés.',
      ],
    },
    {
      titre: '7. Responsabilité',
      paragraphes: [
        'Les fiches sont des idées partagées entre animateurs : celui qui met une activité en place reste responsable de la sécurité du public et du respect de la réglementation des accueils collectifs de mineurs.',
        'Ramdam est fourni tel quel, sans garantie de disponibilité permanente.',
      ],
    },
    {
      titre: '8. Fin du compte',
      paragraphes: [
        'Vous pouvez supprimer votre compte à tout moment depuis « Modifier le profil ». Vos contenus sont alors effacés définitivement.',
      ],
    },
    {
      titre: '9. Modifications et droit applicable',
      paragraphes: [
        'Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de la page. Elles sont soumises au droit français.',
        `Une question : ${CONTACT}`,
      ],
    },
  ],
};

export const politiqueConfidentialite: PageLegale = {
  titre: 'Politique de confidentialité',
  miseAJour: MISE_A_JOUR,
  intro:
    'Ramdam ne collecte que ce qui sert à faire fonctionner le service. Pas de publicité, pas de revente, pas de traceur publicitaire ni de mesure d’audience.',
  sections: [
    {
      titre: 'Responsable du traitement',
      paragraphes: [`Edouard Mouret, ${CONTACT}`],
    },
    {
      titre: 'Les données utilisées',
      paragraphes: [
        '– Compte : e-mail, pseudo, rôle déclaré, date d’acceptation des conditions. Le mot de passe n’est jamais enregistré : seule une empreinte (Argon2) est conservée.',
        '– Profil : bio et photo, si vous en ajoutez.',
        '– Ce que vous publiez : fiches, photos, commentaires, « j’aime », galerie, offres, signalements.',
        '– Activité dans l’app : XP gagnée et notifications.',
        '– Données techniques : adresse IP et pages demandées, dans les journaux du serveur.',
        'Les photos envoyées sont réduites et débarrassées de leurs métadonnées, dont la position GPS de la prise de vue.',
      ],
    },
    {
      titre: 'Pourquoi, et sur quelle base',
      paragraphes: [
        '– Fournir le service (compte, publications, notifications) : exécution des conditions d’utilisation.',
        '– Sécurité et modération (journaux du serveur, signalements) : intérêt légitime à protéger le service et ses membres.',
      ],
    },
    {
      titre: 'Qui voit vos données',
      paragraphes: [
        '– Les autres membres voient votre pseudo, votre photo, votre bio, votre niveau et ce que vous publiez. Votre e-mail n’est jamais affiché.',
        '– L’administrateur voit les contenus signalés.',
        '– L’hébergeur, netcup (Allemagne), stocke les données : elles restent dans l’Union européenne.',
        '– Quand vous tapez une ville dans une offre, le texte tapé est envoyé à l’API Géo de l’État pour proposer des communes, sans rien qui vous identifie.',
      ],
    },
    {
      titre: 'Combien de temps',
      paragraphes: [
        '– Tant que votre compte existe.',
        '– À la suppression du compte, tout est effacé immédiatement et définitivement, photos comprises. Les signalements que vous avez faits restent, sans votre nom.',
        '– Les journaux du serveur sont effacés au bout de 14 jours.',
      ],
    },
    {
      titre: 'Sur votre appareil',
      paragraphes: [
        'Ramdam garde votre session de connexion sur votre appareil (stockage du navigateur, ou trousseau sécurisé du téléphone), ainsi que la date à laquelle vous avez répondu « Plus tard » à l’invitation d’installation. C’est indispensable au fonctionnement : il n’y a pas d’autre cookie ni traceur, donc pas de bandeau de consentement.',
      ],
    },
    {
      titre: 'Sécurité',
      paragraphes: [
        'Connexion chiffrée (HTTPS), mots de passe stockés sous forme d’empreinte, accès à la base limité au strict nécessaire, compte supprimé déconnecté immédiatement.',
      ],
    },
    {
      titre: 'Vos droits',
      paragraphes: [
        '– Accès et rectification : votre profil, modifiable dans l’app.',
        '– Effacement : « Supprimer mon compte », dans « Modifier le profil ».',
        `– Copie de vos données (portabilité), opposition, limitation : écrivez à ${CONTACT}, réponse sous un mois.`,
        'Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (cnil.fr).',
      ],
    },
  ],
};
