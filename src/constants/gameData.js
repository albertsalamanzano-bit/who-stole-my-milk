import auditorSvg from '../assets/auditor.svg';
import becarioSvg from '../assets/becario.svg';
import consultorSvg from '../assets/consultor.svg';
import directorSvg from '../assets/director.svg';
import empleadoSvg from '../assets/empleado.svg';
import sandwichSvg from '../assets/sandwich.svg';

export { sandwichSvg };

export const BASE_GEOMETRIES = [
  [0, 2, 4, 1, 3], // #1:  1-3-5-2-4
  [0, 3, 1, 4, 2], // #2:  1-4-2-5-3
  [1, 3, 0, 2, 4], // #3:  2-4-1-3-5
  [1, 3, 0, 4, 2], // #4:  2-4-1-5-3
  [1, 4, 2, 0, 3], // #5:  2-5-3-1-4
  [2, 0, 3, 1, 4], // #6:  3-1-4-2-5
  [2, 0, 4, 1, 3], // #7:  3-1-5-2-4
  [2, 4, 0, 3, 1], // #8:  3-5-1-4-2
  [2, 4, 1, 3, 0], // #9:  3-5-2-4-1
  [3, 0, 2, 4, 1], // #10: 4-1-3-5-2
  [3, 1, 4, 0, 2], // #11: 4-2-5-1-3
  [3, 1, 4, 2, 0], // #12: 4-2-5-3-1
  [4, 1, 3, 0, 2], // #13: 5-2-4-1-3
  [4, 2, 0, 3, 1]  // #14: 5-3-1-4-2
];

export const ROOMS = [
  {
    id: 0,
    name: 'Azul',
    bgHex: '#D8E8FC',
    bgActive: '#B8D6FA',
    borderHex: '#2563EB'
  },
  {
    id: 1,
    name: 'Rojo',
    bgHex: '#FCDEDE',
    bgActive: '#F9BCTC',
    borderHex: '#DC2626'
  },
  {
    id: 2,
    name: 'Verde',
    bgHex: '#CCF5E2',
    bgActive: '#9EE8C8',
    borderHex: '#059669'
  },
  {
    id: 3,
    name: 'Amarillo',
    bgHex: '#FCF4BB',
    bgActive: '#F9E678',
    borderHex: '#CA8A04'
  },
  {
    id: 4,
    name: 'Morado',
    bgHex: '#E8E2FC',
    bgActive: '#D2C5FA',
    borderHex: '#7C3AED'
  }
];

export const ROOM_TEXT_STYLES = {
  azul: {
    light: 'text-[#3B76C4]',
    dark: 'text-[#B8D8FA]'
  },
  rojo: {
    light: 'text-[#D64C4C]',
    dark: 'text-[#F9B4B4]'
  },
  verde: {
    light: 'text-[#1E9E68]',
    dark: 'text-[#9CECC8]'
  },
  amarillo: {
    light: 'text-[#B89214]',
    dark: 'text-[#F7EA92]'
  },
  morado: {
    light: 'text-[#7652D9]',
    dark: 'text-[#D5C7FA]'
  }
};

export const SUSPECTS = [
  {
    id: 0,
    code: 'A',
    name: 'Analista',
    emoji: consultorSvg,
    diet: 'Mujer',
    isCarnivore: true,
    confession: 'Mis gráficas predecían que ese sándwich iba a caducar'
  },
  {
    id: 1,
    code: 'B',
    name: 'Becaria',
    emoji: becarioSvg,
    diet: 'Mujer',
    isCarnivore: true,
    confession: '¡Perdón! Pensé que era parte del catering de bienvenida'
  },
  {
    id: 2,
    code: 'C',
    name: 'Contable',
    emoji: auditorSvg,
    diet: 'Hombre',
    isCarnivore: false,
    confession: 'Solo apliqué una retención del 100% sobre tu almuerzo'
  },
  {
    id: 3,
    code: 'D',
    name: 'Director',
    emoji: directorSvg,
    diet: 'Hombre',
    isCarnivore: false,
    confession: 'Como jefe, consideré oportuno absorber tus recursos'
  },
  {
    id: 4,
    code: 'E',
    name: 'Enchufado',
    emoji: empleadoSvg,
    diet: 'Hombre',
    isCarnivore: false,
    confession: 'Necesitaba carbohidratos urgentes para terminar el Excel'
  }
];

export const CLUE_CATEGORIES = {
  Umbral: { id: 'Umbral', label: 'Umbral / Puertas' },
  Fachada: { id: 'Fachada', label: 'Fachada / Cardinal' },
  Claustrofobia: { id: 'Claustrofobia', label: 'Claustrofobia / Tamaño' },
  Escenario: { id: 'Escenario', label: 'Tabiques / Vecindad' },
  Sandwich: { id: 'Sandwich', label: 'El Sándwich / Crimen' },
  Despacho: { id: 'Despacho', label: 'Despacho / Género' }
};

const generatePermutations = (arr) => {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = generatePermutations(remaining);
    for (const p of perms) {
      result.push([current, ...p]);
    }
  }
  return result;
};

export const PERMUTATIONS_120 = generatePermutations([0, 1, 2, 3, 4]);

export const COMPLEMENTARY_PAIR_SETS = [
  [['Umbral', 'Fachada'],       ['Claustrofobia', 'Escenario'], ['Sandwich', 'Despacho']],
  [['Umbral', 'Claustrofobia'], ['Fachada', 'Despacho'],        ['Escenario', 'Sandwich']],
  [['Umbral', 'Escenario'],     ['Fachada', 'Sandwich'],        ['Claustrofobia', 'Despacho']],
  [['Umbral', 'Sandwich'],      ['Fachada', 'Claustrofobia'],   ['Escenario', 'Despacho']],
  [['Umbral', 'Despacho'],      ['Fachada', 'Escenario'],       ['Claustrofobia', 'Sandwich']]
];

export const ALL_CATEGORY_PAIRS = COMPLEMENTARY_PAIR_SETS.flat();
