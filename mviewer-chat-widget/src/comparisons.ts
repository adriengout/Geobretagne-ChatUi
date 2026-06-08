export type ComparisonUnit = {
  id: string;
  label: string;
  labelShort: string;
  icon: string;
  toDisplay: (energyKwh: number) => string;
};

export type CustomUnitDef = {
  id: string;
  title: string;
  value: number;
  inputUnit: 'W' | 'Wh' | 'kWh';
};

export function customToComparisonUnit(def: CustomUnitDef): ComparisonUnit {
  return {
    id: def.id,
    label: def.title,
    labelShort: def.title,
    icon: '⚙️',
    toDisplay: (kWh) => {
      if (def.inputUnit === 'W') {
        // Puissance → durée d'utilisation
        return `${fmtSeconds((kWh * 3_600_000) / def.value)} de ${def.title}`;
      }
      // Énergie → nombre d'occurrences
      const whRef = def.inputUnit === 'kWh' ? def.value * 1000 : def.value;
      const n = (kWh * 1000) / whRef;
      if (n < 0.001) return `< 0,001 ${def.title}`;
      if (n < 0.01)  return `${n.toFixed(3)} ${def.title}`;
      if (n < 10)    return `${n.toFixed(2)} ${def.title}`;
      return `${Math.ceil(n)} ${def.title}`;
    },
  };
}

function fmtMeters(m: number): string {
  if (m < 0.001) return '< 1 mm';
  if (m < 0.01)  return `${(m * 1000).toFixed(0)} mm`;
  if (m < 1)     return `${(m * 100).toFixed(1)} cm`;
  return `${m.toFixed(2)} m`;
}

function fmtSeconds(s: number): string {
  if (s < 0.001)  return '< 1 ms';
  if (s < 1)      return `${(s * 1000).toFixed(0)} ms`;
  if (s < 60)     return `${s.toFixed(1)} s`;
  const min = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${min} min ${sec} s`;
}

export const COMPARISON_UNITS: ComparisonUnit[] = [
  {
    id: 'megane',
    label: 'La Mégane électrique',
    labelShort: 'Mégane ⚡',
    icon: '🚗',
    // Mégane E-Tech : ~160 Wh/km → 1 kWh = 6 250 m
    toDisplay: (kWh) => `${fmtMeters(kWh * 6250)} en Mégane électrique`,
  },
  {
    id: 'four',
    label: 'Le four',
    labelShort: 'Four',
    icon: '🍳',
    // Four classique ~2 200 W → 1 kWh = 3 600/2,2 ≈ 1 636 s
    toDisplay: (kWh) => `${fmtSeconds(kWh * 1636)} de four allumé`,
  },
  {
    id: 'airfryer',
    label: "L'air fryer",
    labelShort: 'Air fryer',
    icon: '🔥',
    // Air fryer ~1 600 W → 1 kWh = 3 600/1,6 = 2 250 s
    toDisplay: (kWh) => `${fmtSeconds(kWh * 2250)} d'air fryer`,
  },
  {
    id: 'velo',
    label: 'Le vélo électrique',
    labelShort: 'Vélo élec.',
    icon: '🚲',
    // Vélo élec. ~15 Wh/km → 1 kWh = 66 667 m
    toDisplay: (kWh) => `${fmtMeters(kWh * 66667)} en vélo électrique`,
  },
  {
    id: 'corps',
    label: 'Le corps humain (énergie)',
    labelShort: 'Corps humain',
    icon: '🧬',
    // Métabolisme basal ~80 W → 1 kWh = 45 000 s
    toDisplay: (kWh) => `${fmtSeconds(kWh * 45000)} de métabolisme humain`,
  },
  {
    id: 'google',
    label: 'Requêtes Google',
    labelShort: 'Google',
    icon: '🔍',
    // ~0,3 Wh par requête Google (estimation Google) → 1 kWh = 3 333 requêtes
    toDisplay: (kWh) => {
      const n = Math.ceil(kWh * 3333);
      return `${n} requête${n > 1 ? 's' : ''} Google`;
    },
  },
  {
    id: 'eau',
    label: 'Eau (refroidissement data center)',
    labelShort: 'Eau data center',
    icon: '💧',
    // WUE moyen industrie : ~1,8 L/kWh (Water Usage Effectiveness)
    // Google ~1,1 L/kWh, moyenne sectorielle US/EU ~1,8 L/kWh
    toDisplay: (kWh) => {
      const mL = kWh * 1800;
      if (mL < 1)    return `${(mL * 1000).toFixed(0)} µL (refroidissement data center)`;
      if (mL < 1000) return `${mL.toFixed(1)} mL (refroidissement data center)`;
      return `${(mL / 1000).toFixed(2)} L (refroidissement data center)`;
    },
  },
  {
    id: 'led',
    label: 'Éclairage LED de bureau',
    labelShort: 'LED bureau',
    icon: '💡',
    // LED de bureau ~20 W → 1 kWh = 180 000 s
    toDisplay: (kWh) => `${fmtSeconds(kWh * 180000)} de panneau LED allumé`,
  },
];
