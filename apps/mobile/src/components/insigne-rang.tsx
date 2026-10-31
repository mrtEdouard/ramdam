import {
  BlurMask,
  Canvas,
  Circle,
  ColorMatrix,
  DashPathEffect,
  Group,
  LinearGradient,
  Oval,
  Paint,
  Path,
  RadialGradient,
  Rect,
  Shadow,
  useClock,
  vec,
  type Transforms3d,
} from '@shopify/react-native-skia';
import type { ReactNode } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

// Insigne de rang du profil, dans l'esprit des emblèmes de prestige des jeux vidéo :
// plus le niveau monte, plus le métal est précieux et plus l'insigne s'orne (ailes, couronne,
// rayons, aura). Une flamme au centre rappelle les noms des niveaux.
// Tout est dessiné dans un carré de 200 × 200, avec une marge de 10 pour les éléments qui débordent.

const BOITE = 220;
const CONTOUR = '#160F1E';

// Dégradés de chaque métal, du reflet clair en haut à l'ombre en bas.
const metaux = {
  bronze: ['#FFD9A8', '#C47A3A', '#5C2E10'],
  argent: ['#FFFFFF', '#AEB8C6', '#4E5868'],
  or: ['#FFF6C2', '#F2B530', '#8A4E06'],
  platine: ['#FFFFFF', '#9FD4FF', '#2D5A9A'],
  rubis: ['#FF8A7A', '#D3122A', '#4A0610'],
  cosmos: ['#F3E3FF', '#A45BFF', '#22074F'],
  obsidienne: ['#3B3552', '#241F35', '#0D0B16'],
} as const;
type Metal = keyof typeof metaux;

function Degrade({ metal, haut, bas }: { metal: Metal; haut: number; bas: number }) {
  return (
    <LinearGradient
      start={vec(0, haut)}
      end={vec(0, bas)}
      colors={[...metaux[metal]]}
      positions={[0, 0.45, 1]}
    />
  );
}

// ---------- Formes, écrites comme des chemins SVG ----------

const polygone = (points: [number, number][]) =>
  `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')} Z`;

const hexagone = (r: number) =>
  polygone(
    Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 6 + (i * Math.PI) / 3;
      return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r];
    }),
  );

const etoile = (cx: number, cy: number, grand: number, petit: number, branches = 5) =>
  polygone(
    Array.from({ length: branches * 2 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / branches;
      const d = i % 2 ? petit : grand;
      return [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
    }),
  );

const rayons = (nombre: number, interieur: number, exterieur: number) =>
  Array.from({ length: nombre }, (_, i) => {
    const a = (i * 2 * Math.PI) / nombre;
    const point = (angle: number, d: number): [number, number] => [
      100 + Math.cos(angle) * d,
      100 + Math.sin(angle) * d,
    ];
    return polygone([point(a - 0.07, interieur), point(a, exterieur), point(a + 0.07, interieur)]);
  }).join(' ');

const ECUSSON = 'M100 30 L156 48 V98 C156 134 130 158 100 170 C70 158 44 134 44 98 V48 Z';
const FLAMME =
  'M100 62 C111 78 124 88 122 108 C121 122 111 132 100 134 C89 132 79 122 78 108 C77 96 84 88 90 80 C90 90 94 96 98 98 C96 86 97 74 100 62 Z';
const COEUR_FLAMME =
  'M100 92 C106 101 112 106 111 116 C110 123 105 127 100 128 C95 127 90 123 89 116 C88 110 92 104 95 100 C96 106 98 108 100 109 C99 103 99 97 100 92 Z';
const COURONNE = 'M74 40 L80 18 L90 32 L100 10 L110 32 L120 18 L126 40 Z';
// Une plume en forme de lame, pointée vers la gauche depuis son point d'attache.
const plume = (longueur: number) =>
  `M0 -6 C${-longueur * 0.35} -13 ${-longueur * 0.8} -10 ${-longueur} 0 C${-longueur * 0.8} 5 ${-longueur * 0.35} 8 0 6 Z`;

// Agrandit ou réduit un dessin autour du centre de l'insigne.
const autourDuCentre = (echelle: number, decalageY = 0): Transforms3d => [
  { translateX: 100 },
  { translateY: 100 + decalageY },
  { scale: echelle },
  { translateX: -100 },
  { translateY: -100 },
];
const MIROIR: Transforms3d = [{ translateX: 200 }, { scaleX: -1 }];

// ---------- Éléments de décor ----------

function Forme({
  d,
  metal,
  haut,
  bas,
  epaisseur = 2.5,
  ombre = false,
}: {
  d: string;
  metal: Metal;
  haut: number;
  bas: number;
  epaisseur?: number;
  ombre?: boolean;
}) {
  return (
    <>
      <Path path={d}>
        <Degrade metal={metal} haut={haut} bas={bas} />
        {ombre && <Shadow dx={0} dy={3} blur={4} color="rgba(0, 0, 0, 0.6)" />}
      </Path>
      <Path path={d} style="stroke" strokeWidth={epaisseur} strokeJoin="round" color={CONTOUR} />
    </>
  );
}

function Aile({ metal, echelle }: { metal: Metal; echelle: number }) {
  // Six plumes en éventail, de la plus basse à la plus haute, qui partent du flanc de l'insigne.
  const plumes = [
    [58, 72],
    [42, 86],
    [26, 92],
    [10, 88],
    [-6, 78],
    [-22, 66],
  ].map(([angle, longueur]) => (
    <Group
      key={angle}
      transform={[{ translateX: 70 }, { translateY: 104 }, { rotate: (angle * Math.PI) / 180 }]}
    >
      <Forme d={plume(longueur)} metal={metal} haut={-8} bas={8} epaisseur={1.4} />
    </Group>
  ));
  const demiAile = <Group transform={autourDuCentre(echelle)}>{plumes}</Group>;
  return (
    <>
      {demiAile}
      <Group transform={MIROIR}>{demiAile}</Group>
    </>
  );
}

function Flamme({ lueur }: { lueur?: SharedValue<number> }) {
  return (
    <>
      {lueur && (
        <Path path={FLAMME} color="#FFB347" opacity={lueur}>
          <BlurMask blur={6} style="normal" />
        </Path>
      )}
      <Path path={FLAMME}>
        <LinearGradient
          start={vec(0, 134)}
          end={vec(0, 62)}
          colors={['#FF3D1F', '#FF9A2E', '#FFE9A0']}
          positions={[0, 0.55, 1]}
        />
      </Path>
      <Path path={FLAMME} style="stroke" strokeWidth={1.5} color="#2A0D05" />
      <Path path={COEUR_FLAMME} color="#FFF6D8" />
    </>
  );
}

function Etoiles({ nombre, y }: { nombre: number; y: number }) {
  return (
    <>
      {Array.from({ length: nombre }, (_, i) => {
        const ecart = i - (nombre - 1) / 2;
        return (
          <Forme
            key={i}
            d={etoile(100 + ecart * 18, y - Math.abs(ecart) * 3, 8, 3.4)}
            metal="or"
            haut={y - 8}
            bas={y + 8}
            epaisseur={1}
          />
        );
      })}
    </>
  );
}

function Couronne({ gemme }: { gemme: string }) {
  return (
    <>
      <Forme d={COURONNE} metal="or" haut={10} bas={40} epaisseur={1.5} />
      <Circle cx={100} cy={30} r={4} color={gemme} />
      <Circle cx={84} cy={34} r={2.6} color={gemme} />
      <Circle cx={116} cy={34} r={2.6} color={gemme} />
    </>
  );
}

function Lauriers() {
  const feuilles = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI * 0.62 + i * 0.2;
    const x = 100 + Math.cos(a) * 74;
    const y = 104 + Math.sin(a) * 74;
    return (
      <Group key={i} origin={vec(x, y)} transform={[{ rotate: a + Math.PI / 2 + 0.5 }]}>
        <Oval x={x - 3.6} y={y - 8.5} width={7.2} height={17}>
          <Degrade metal="platine" haut={y - 8.5} bas={y + 8.5} />
        </Oval>
      </Group>
    );
  });
  return (
    <>
      {feuilles}
      <Group transform={MIROIR}>{feuilles}</Group>
    </>
  );
}

// Reflet de lumière qui balaie le métal, limité à la forme de l'insigne.
function Reflet({ forme, position }: { forme: string; position: SharedValue<number> }) {
  return (
    <Group clip={forme}>
      <Group origin={vec(100, 100)} transform={[{ rotate: 0.35 }]}>
        <Rect x={position} y={-40} width={22} height={280} color="rgba(255, 255, 255, 0.28)" />
      </Group>
    </Group>
  );
}

function Eclat({
  x,
  y,
  taille,
  horloge,
  phase,
}: {
  x: number;
  y: number;
  taille: number;
  horloge: SharedValue<number>;
  phase: number;
}) {
  const opacite = useDerivedValue(() => 0.5 + 0.5 * Math.sin(horloge.value / 300 + phase));
  return <Path path={etoile(x, y, taille, taille * 0.3, 4)} color="#FFF4C8" opacity={opacite} />;
}

// ---------- Les six rangs ----------

type Animations = {
  horloge: SharedValue<number>;
  rotation: SharedValue<{ rotate: number }[]>;
  rotationInverse: SharedValue<{ rotate: number }[]>;
  pulsation: SharedValue<number>;
  lueur: SharedValue<number>;
  reflet: SharedValue<number>;
};

const rangs: Record<number, (a: Animations) => ReactNode> = {
  1: () => (
    <>
      <Forme d={hexagone(64)} metal="bronze" haut={36} bas={164} ombre />
      <Path path={hexagone(52)}>
        <Degrade metal="obsidienne" haut={48} bas={152} />
      </Path>
      <Path path={hexagone(52)} style="stroke" strokeWidth={2} color="#E8A86A" />
      <Flamme />
    </>
  ),
  2: () => (
    <>
      <Forme d={ECUSSON} metal="argent" haut={30} bas={170} ombre />
      <Group transform={autourDuCentre(0.82)}>
        <Path path={ECUSSON}>
          <Degrade metal="obsidienne" haut={30} bas={170} />
        </Path>
        <Path path={ECUSSON} style="stroke" strokeWidth={2.4} color="#E6ECF5" />
      </Group>
      <Path
        path="M76 140 L100 152 L124 140"
        style="stroke"
        strokeWidth={6}
        strokeJoin="round"
        color="#C9D2DE"
      />
      <Flamme />
      <Forme d={etoile(100, 44, 9, 3.8)} metal="argent" haut={35} bas={53} epaisseur={1} />
    </>
  ),
  3: ({ lueur, reflet }) => (
    <>
      <Aile metal="or" echelle={0.78} />
      <Forme d={ECUSSON} metal="or" haut={30} bas={170} ombre />
      <Reflet forme={ECUSSON} position={reflet} />
      <Group transform={autourDuCentre(0.82)}>
        <Path path={ECUSSON}>
          <Degrade metal="rubis" haut={30} bas={170} />
        </Path>
        <Path path={ECUSSON} style="stroke" strokeWidth={2.4} color="#FFE7A0" />
      </Group>
      <Path
        path="M74 138 L100 152 L126 138 M78 128 L100 140 L122 128"
        style="stroke"
        strokeWidth={5}
        strokeJoin="round"
        color="#F2B530"
      />
      <Flamme lueur={lueur} />
      <Etoiles nombre={3} y={178} />
    </>
  ),
  4: ({ lueur, reflet, horloge }) => (
    <>
      <Lauriers />
      <Forme d={etoile(100, 100, 84, 58, 8)} metal="platine" haut={16} bas={184} ombre />
      <Reflet forme={etoile(100, 100, 84, 58, 8)} position={reflet} />
      <Circle cx={100} cy={100} r={50}>
        <Degrade metal="obsidienne" haut={50} bas={150} />
      </Circle>
      <Circle cx={100} cy={100} r={50} style="stroke" strokeWidth={3} color="#CFE9FF" />
      <Circle cx={100} cy={100} r={44} style="stroke" strokeWidth={1.2} color="#5FB4FF">
        <DashPathEffect intervals={[3, 4]} />
      </Circle>
      <Flamme lueur={lueur} />
      {[0, 1, 2, 3].map((i) => {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        return (
          <Eclat
            key={i}
            x={100 + Math.cos(a) * 66}
            y={100 + Math.sin(a) * 66}
            taille={6}
            horloge={horloge}
            phase={i * 1.6}
          />
        );
      })}
    </>
  ),
  5: ({ lueur, reflet, pulsation }) => (
    <>
      <Circle cx={100} cy={100} r={98} opacity={pulsation}>
        <RadialGradient
          c={vec(100, 100)}
          r={98}
          colors={['rgba(255, 106, 46, 0.8)', 'rgba(255, 46, 46, 0)']}
        />
      </Circle>
      <Aile metal="rubis" echelle={1.05} />
      <Aile metal="or" echelle={0.8} />
      <Forme d={ECUSSON} metal="or" haut={30} bas={170} epaisseur={3} ombre />
      <Reflet forme={ECUSSON} position={reflet} />
      <Group transform={autourDuCentre(0.84)}>
        <Path path={ECUSSON}>
          <Degrade metal="obsidienne" haut={30} bas={170} />
        </Path>
        <Path path={ECUSSON} style="stroke" strokeWidth={3} color="#FF5A3C" />
      </Group>
      <Couronne gemme="#FF2E4A" />
      <Flamme lueur={lueur} />
      <Etoiles nombre={5} y={178} />
    </>
  ),
  6: ({ lueur, reflet, pulsation, rotation, rotationInverse, horloge }) => (
    <>
      <Group origin={vec(100, 100)} transform={rotation}>
        <Path path={rayons(24, 70, 110)} color="#FFD66B" />
      </Group>
      <Group origin={vec(100, 100)} transform={rotationInverse}>
        <Path path={rayons(12, 64, 100)} color="#B05BFF" />
      </Group>
      <Circle cx={100} cy={100} r={104} opacity={pulsation}>
        <RadialGradient
          c={vec(100, 100)}
          r={104}
          colors={['rgba(255, 227, 138, 0.9)', 'rgba(176, 91, 255, 0.6)', 'rgba(90, 27, 255, 0)']}
          positions={[0, 0.45, 1]}
        />
      </Circle>
      <Aile metal="cosmos" echelle={1.22} />
      <Aile metal="or" echelle={1.02} />
      <Aile metal="rubis" echelle={0.8} />
      <Forme d={etoile(100, 100, 80, 62, 12)} metal="or" haut={20} bas={180} epaisseur={3} ombre />
      <Reflet forme={etoile(100, 100, 80, 62, 12)} position={reflet} />
      <Group transform={autourDuCentre(0.78, 2)}>
        <Path path={ECUSSON}>
          <Degrade metal="cosmos" haut={30} bas={170} />
        </Path>
        <Path path={ECUSSON} style="stroke" strokeWidth={3.5} color="#FFF2B0" />
      </Group>
      <Group transform={autourDuCentre(0.62, 2)}>
        <Path path={ECUSSON}>
          <Degrade metal="obsidienne" haut={30} bas={170} />
        </Path>
        <Path path={ECUSSON} style="stroke" strokeWidth={3} color="#FFD66B" />
      </Group>
      <Couronne gemme="#C46BFF" />
      <Flamme lueur={lueur} />
      <Etoiles nombre={5} y={182} />
      <Group origin={vec(100, 100)} transform={rotation}>
        <Circle cx={100} cy={100} r={90} style="stroke" strokeWidth={1.5} color="#FFE38A">
          <DashPathEffect intervals={[2, 10]} />
        </Circle>
      </Group>
      {[
        [30, 40],
        [172, 52],
        [24, 150],
        [178, 140],
        [100, 2],
        [62, 18],
        [140, 20],
      ].map(([x, y], i) => (
        <Eclat key={i} x={x} y={y} taille={5 + (i % 3)} horloge={horloge} phase={i * 1.3} />
      ))}
    </>
  ),
};

// Niveau pas encore atteint : l'insigne en niveaux de gris et à moitié transparent.
const NIVEAUX_DE_GRIS = [
  0.3, 0.55, 0.15, 0, 0, 0.3, 0.55, 0.15, 0, 0, 0.3, 0.55, 0.15, 0, 0, 0, 0, 0, 1, 0,
];

type Props = {
  niveau: number;
  taille: number;
  verrouille?: boolean;
};

export default function InsigneRang({ niveau, taille, verrouille = false }: Props) {
  const horloge = useClock();
  // Un insigne verrouillé ne bouge pas : toutes les animations restent à leur valeur de départ.
  const temps = useDerivedValue(() => (verrouille ? 0 : horloge.value));

  const animations: Animations = {
    horloge: temps,
    // Les rayons font un tour complet en 30 secondes, le second cercle dans l'autre sens.
    rotation: useDerivedValue(() => [{ rotate: (temps.value / 30000) * Math.PI * 2 }]),
    rotationInverse: useDerivedValue(() => [{ rotate: -(temps.value / 22000) * Math.PI * 2 }]),
    pulsation: useDerivedValue(() => 0.7 + 0.3 * Math.sin(temps.value / 450)),
    // La lueur de la flamme vacille : deux sinus de vitesses différentes donnent un rythme irrégulier.
    lueur: useDerivedValue(
      () => 0.7 + 0.2 * Math.sin(temps.value / 140) + 0.1 * Math.sin(temps.value / 53),
    ),
    // Le reflet traverse l'insigne en 0,9 seconde, puis attend avant le passage suivant.
    reflet: useDerivedValue(() => {
      const cycle = (temps.value % 4000) / 900;
      return cycle < 1 ? -40 + cycle * 260 : 400;
    }),
  };

  const dessiner = rangs[niveau] ?? rangs[1];
  const echelle = taille / BOITE;

  return (
    <Canvas style={{ width: taille, height: taille }}>
      <Group
        transform={[{ scale: echelle }, { translateX: 10 }, { translateY: 10 }]}
        opacity={verrouille ? 0.45 : 1}
        layer={
          verrouille ? (
            <Paint>
              <ColorMatrix matrix={NIVEAUX_DE_GRIS} />
            </Paint>
          ) : undefined
        }
      >
        {dessiner(animations)}
      </Group>
    </Canvas>
  );
}
