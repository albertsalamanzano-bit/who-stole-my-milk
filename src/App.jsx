import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Share2,
  Check,
  X,
  Copy,
  Shuffle,
  Calendar,
  Clock,
  Menu,
  Trophy,
  Send,
  History,
  RotateCcw,
  HelpCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

import auditorSvg from './assets/auditor.svg';
import becarioSvg from './assets/becario.svg';
import consultorSvg from './assets/consultor.svg';
import directorSvg from './assets/director.svg';
import empleadoSvg from './assets/empleado.svg';
import sandwichSvg from './assets/sandwich.svg';
import { Analytics } from '@vercel/analytics/react';

// ============================================================================
// 0. CONFIGURACIÓN DE SUPABASE (RANKING DIARIO)
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const BAD_WORDS = [
  'puto',
  'puta',
  'mierda',
  'gilipollas',
  'cabron',
  'cabrón',
  'pene',
  'polla',
  'coño',
  'hijoputa',
  'joder',
  'maricon',
  'maricón',
  'zorra',
  'subnormal'
];

function sanitizeText(str) {
  if (!str) return '';
  let clean = str.trim().replace(/\s+/g, ' ');
  BAD_WORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    clean = clean.replace(regex, '***');
  });
  return clean;
}

// Limpia comillas o puntos sobrantes al inicio/final de cualquier declaración
function cleanStatementText(str) {
  if (!str) return '';
  return str
    .trim()
    .replace(/^[«"'“”]+|[»"'“”]+$/g, '')
    .replace(/\.+$/g, '')
    .trim();
}

// ============================================================================
// 1. CONSTANTES MATEMÁTICAS Y CONFIGURACIÓN DEL SISTEMA
// ============================================================================

const BASE_GEOMETRIES = [
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

// Colores pastel para los 5 Despachos
const ROOMS = [
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

// Estilos de texto fieles a los tonos pastel de cada sala, adaptados a Modo Claro y Modo Oscuro
const ROOM_TEXT_STYLES = {
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

const SUSPECTS = [
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

const CLUE_CATEGORIES = {
  Umbral: { id: 'Umbral', label: 'Umbral / Puertas' },
  Fachada: { id: 'Fachada', label: 'Fachada / Cardinal' },
  Claustrofobia: { id: 'Claustrofobia', label: 'Claustrofobia / Tamaño' },
  Escenario: { id: 'Escenario', label: 'Contacto Escenario' },
  Paranoia: { id: 'Paranoia', label: 'Paranoia Cruzada' },
  Despacho: { id: 'Despacho', label: 'Despacho / Dieta' }
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

const PERMUTATIONS_120 = generatePermutations([0, 1, 2, 3, 4]);

// Función auxiliar para resaltar palabras clave (**...**), colorear despachos y mostrar el SVG del sándwich
function renderFormattedClue(text, isDark) {
  if (!text) return null;
  const cleaned = cleanStatementText(text);
  const parts = cleaned.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      const lower = content.toLowerCase();

      const matchedColor = Object.keys(ROOM_TEXT_STYLES).find((colorKey) =>
        lower.includes(colorKey)
      );

      if (matchedColor) {
        const styleObj = ROOM_TEXT_STYLES[matchedColor];
        const colorClasses = isDark ? styleObj.dark : styleObj.light;
        return (
          <strong key={idx} className={`font-bold ${colorClasses}`}>
            {content}
          </strong>
        );
      }

      if (lower.includes('sándwich') || lower.includes('sandwich')) {
        return (
          <strong
            key={idx}
            className={`font-bold inline-flex items-center gap-1 align-baseline ${
              isDark ? 'text-white' : 'text-neutral-950'
            }`}
          >
            <span>{content}</span>
            <img
              src={sandwichSvg}
              alt="sándwich"
              className="w-3.5 h-3.5 object-contain inline-block self-center shrink-0"
            />
          </strong>
        );
      }

      return (
        <strong
          key={idx}
          className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}
        >
          {content}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

// ============================================================================
// 2. SISTEMA DE SEMILLA PSEUDOALEATORIA DETERMINISTA (MULBERRY32)
// ============================================================================

function createPrng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shuffle = (array, rng = Math.random) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const COMPLEMENTARY_TRIO_PAIRS = [
  [['Umbral', 'Fachada', 'Claustrofobia'], ['Escenario', 'Paranoia', 'Despacho']],
  [['Umbral', 'Fachada', 'Escenario'],       ['Claustrofobia', 'Paranoia', 'Despacho']],
  [['Umbral', 'Fachada', 'Paranoia'],        ['Claustrofobia', 'Escenario', 'Despacho']],
  [['Umbral', 'Fachada', 'Despacho'],        ['Claustrofobia', 'Escenario', 'Paranoia']],
  [['Umbral', 'Claustrofobia', 'Escenario'],['Fachada', 'Paranoia', 'Despacho']],
  [['Umbral', 'Claustrofobia', 'Paranoia'],['Fachada', 'Escenario', 'Despacho']],
  [['Umbral', 'Claustrofobia', 'Despacho'],['Fachada', 'Escenario', 'Paranoia']],
  [['Umbral', 'Escenario', 'Paranoia'],      ['Fachada', 'Claustrofobia', 'Despacho']],
  [['Umbral', 'Escenario', 'Despacho'],      ['Fachada', 'Claustrofobia', 'Paranoia']],
  [['Umbral', 'Paranoia', 'Despacho'],       ['Fachada', 'Claustrofobia', 'Escenario']]
];

function getDailyConfig(date = new Date()) {
  const epoch = new Date(2026, 0, 1).setHours(0, 0, 0, 0);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayIndex = Math.max(0, Math.round((today - epoch) / 86400000));

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateSeed = parseInt(`${y}${m}${d}`, 10);

  const cycleNumber = Math.floor(dayIndex / 20);
  const dayInCycle = dayIndex % 20;
  const cycleRng = createPrng(cycleNumber + 77777);

  const shuffledPairs = shuffle(COMPLEMENTARY_TRIO_PAIRS, cycleRng);
  const pairIdx = Math.floor(dayInCycle / 2);
  const isSecondOfPair = dayInCycle % 2;

  const pairOrder = cycleRng() < 0.5 ? [0, 1] : [1, 0];
  const dailyCategories = shuffledPairs[pairIdx][pairOrder[isSecondOfPair]];

  return {
    dayNumber: dayIndex + 1,
    seed: dateSeed,
    categories: dailyCategories,
    formattedDate: `${d}/${m}/${y}`
  };
}

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diff = Math.max(0, Math.floor((midnight - now) / 1000));

  const h = String(Math.floor(diff / 3600)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const s = String(diff % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Función para detectar si hay un caso compartido en la URL (?caso=123456)
function getSeedFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const casoParam = params.get('caso');
  if (!casoParam) return null;
  const parsed = parseInt(casoParam, 10);
  return !Number.isNaN(parsed) && parsed > 0 ? parsed : null;
}

// ============================================================================
// 3. MOTOR DE GENERACIÓN ALGORÍTMICA (EMBUDO 14 -> K -> K*120 -> 1)
// ============================================================================

function generateRoomsAndVase(solGeo, rng) {
  const grid = Array.from({ length: 5 }, () => Array(5).fill(-1));
  const roomOrder = shuffle([0, 1, 2, 3, 4], rng);
  const roomSizes = [1, 1, 1, 1, 1];

  for (let r = 0; r < 5; r++) {
    const c = solGeo[r];
    grid[r][c] = roomOrder[r];
  }

  let unassigned = 20;
  let guard = 0;
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];

  while (unassigned > 0 && guard < 500) {
    guard++;
    const candidates = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c] !== -1) continue;
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && grid[nr][nc] !== -1) {
            const roomId = grid[nr][nc];
            const weight = roomSizes[roomId] < 6 ? 3 : 1;
            for (let w = 0; w < weight; w++) {
              candidates.push({ r, c, roomId });
            }
          }
        }
      }
    }
    if (candidates.length === 0) break;
    const pick = candidates[Math.floor(rng() * candidates.length)];
    grid[pick.r][pick.c] = pick.roomId;
    roomSizes[pick.roomId]++;
    unassigned--;
  }

  if (roomSizes.some((s) => s < 3)) return null;

  const freeCells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (solGeo[r] !== c) {
        freeCells.push({ r, c });
      }
    }
  }
  const vasePos = freeCells[Math.floor(rng() * freeCells.length)];
  const vaseRoom = grid[vasePos.r][vasePos.c];

  return { grid, vasePos, vaseRoom };
}

function getSurvivingGeometries(grid, vasePos) {
  const surviving = [];
  BASE_GEOMETRIES.forEach((geo, idx) => {
    let valid = true;
    const seenRooms = new Set();
    for (let r = 0; r < 5; r++) {
      const c = geo[r];
      if (r === vasePos.r && c === vasePos.c) {
        valid = false;
        break;
      }
      const room = grid[r][c];
      if (seenRooms.has(room)) {
        valid = false;
        break;
      }
      seenRooms.add(room);
    }
    if (valid && seenRooms.size === 5) {
      surviving.push({ idx, geo });
    }
  });
  return surviving;
}

function placeStrategicDoors(grid, vasePos, survivingGeos, rng) {
  const allWalls = [];
  const hotCells = new Set();
  survivingGeos.forEach(({ geo }) => {
    for (let r = 0; r < 5; r++) {
      hotCells.add(`${r},${geo[r]}`);
    }
  });

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (c + 1 < 5 && grid[r][c] !== grid[r][c + 1]) {
        const isVaseAdjacent =
          (r === vasePos.r && c === vasePos.c) || (r === vasePos.r && c + 1 === vasePos.c);
        if (!isVaseAdjacent) {
          const hotCount =
            (hotCells.has(`${r},${c}`) ? 1 : 0) + (hotCells.has(`${r},${c + 1}`) ? 1 : 0);
          allWalls.push({
            r1: r,
            c1: c,
            r2: r,
            c2: c + 1,
            orientation: 'vertical',
            roomA: grid[r][c],
            roomB: grid[r][c + 1],
            hotCount
          });
        }
      }
      if (r + 1 < 5 && grid[r][c] !== grid[r + 1][c]) {
        const isVaseAdjacent =
          (r === vasePos.r && c === vasePos.c) || (r + 1 === vasePos.r && c === vasePos.c);
        if (!isVaseAdjacent) {
          const hotCount =
            (hotCells.has(`${r},${c}`) ? 1 : 0) + (hotCells.has(`${r + 1},${c}`) ? 1 : 0);
          allWalls.push({
            r1: r,
            c1: c,
            r2: r + 1,
            c2: c,
            orientation: 'horizontal',
            roomA: grid[r][c],
            roomB: grid[r + 1][c],
            hotCount
          });
        }
      }
    }
  }

  if (allWalls.length < 4) return null;

  const shuffledWalls = shuffle(allWalls, rng).sort((a, b) => b.hotCount - a.hotCount);
  const selectedDoors = [];
  const usedPairs = new Set();

  for (const w of shuffledWalls) {
    if (selectedDoors.length === 4) break;
    const pairKey = [Math.min(w.roomA, w.roomB), Math.max(w.roomA, w.roomB)].join('-');
    if (!usedPairs.has(pairKey)) {
      usedPairs.add(pairKey);
      selectedDoors.push(w);
    }
  }

  for (const w of shuffledWalls) {
    if (selectedDoors.length === 4) break;
    if (!selectedDoors.includes(w)) {
      selectedDoors.push(w);
    }
  }

  if (selectedDoors.length < 4) return null;

  return shuffle(selectedDoors, rng).map((door, idx) => ({
    ...door,
    number: idx + 1
  }));
}

function buildStateObject(geoIdx, geo, perm, grid, doors) {
  const suspectRow = new Array(5);
  const suspectCol = new Array(5);
  const suspectRoom = new Array(5);
  const roomSuspect = new Array(5);

  for (let r = 0; r < 5; r++) {
    const c = geo[r];
    const sId = perm[r];
    const room = grid[r][c];
    suspectRow[sId] = r;
    suspectCol[sId] = c;
    suspectRoom[sId] = room;
    roomSuspect[room] = sId;
  }

  const doorOccupant = new Array(5).fill(-1);
  const suspectDoors = Array.from({ length: 5 }, () => []);

  for (const d of doors) {
    for (let sId = 0; sId < 5; sId++) {
      const sr = suspectRow[sId];
      const sc = suspectCol[sId];
      if ((sr === d.r1 && sc === d.c1) || (sr === d.r2 && sc === d.c2)) {
        doorOccupant[d.number] = sId;
        suspectDoors[sId].push(d.number);
      }
    }
  }

  return {
    geoIdx,
    geo,
    perm,
    suspectRow,
    suspectCol,
    suspectRoom,
    roomSuspect,
    doorOccupant,
    suspectDoors
  };
}

function analyzeMapTopology(grid, vasePos, doors) {
  const roomSizes = [0, 0, 0, 0, 0];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      roomSizes[grid[r][c]]++;
    }
  }

  const maxSize = Math.max(...roomSizes);
  const minSize = Math.min(...roomSizes);
  const largestRooms = roomSizes
    .map((s, idx) => (s === maxSize ? idx : -1))
    .filter((idx) => idx !== -1);
  const smallestRooms = roomSizes
    .map((s, idx) => (s === minSize ? idx : -1))
    .filter((idx) => idx !== -1);

  const roomDoors = Array.from({ length: 5 }, () => []);
  const doorMap = {};
  for (const d of doors) {
    doorMap[d.number] = [d.roomA, d.roomB];
    roomDoors[d.roomA].push(d.number);
    roomDoors[d.roomB].push(d.number);
  }

  const cellTouchesRoomWall = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => new Set())
  );
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const myRoom = grid[r][c];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 5 && nc >= 0 && nc >= 0 && nc < 5) {
          const neighborRoom = grid[nr][nc];
          if (neighborRoom !== myRoom) {
            cellTouchesRoomWall[r][c].add(neighborRoom);
          }
        }
      }
    }
  }

  return {
    roomSizes,
    maxSize,
    minSize,
    largestRooms,
    smallestRooms,
    roomDoors,
    doorMap,
    cellTouchesRoomWall
  };
}

// Clasifica cada pista según su rol deductivo para evitar el "efecto de los 3 ciegos":
// - 'anchor': El sospechoso habla de su propia posición/despacho respecto a elementos fijos del mapa.
// - 'board': Observación global de huecos o géneros en el mapa (sin depender de otro sospechoso concreto).
// - 'paranoia': Acusaciones, defensas o datos sobre el ladrón.
// - 'relational': Posición o despacho en función de otro sospechoso concreto (A respecto a B).
function getClueRole(clue) {
  if (clue.category === 'Paranoia') return 'paranoia';
  const id = clue.id;

  if (
    id.startsWith('self_') ||
    id.startsWith('room_') ||
    id.startsWith('facade_') ||
    id === 'south_half_rows' ||
    id === 'central_axes' ||
    id === 'main_diagonals' ||
    id.startsWith('adj_to_vase_') ||
    id === 'same_line_as_vase' ||
    id === 'no_line_as_vase' ||
    id === 'knight_to_vase' ||
    id === 'touch_many_rooms' ||
    id === 'deep_inside_room' ||
    id.startsWith('touch_wall_of_room_')
  ) {
    return 'anchor';
  }

  if (
    id.startsWith('nobody_door_') ||
    id.startsWith('someone_door_') ||
    id.startsWith('carnivore_') ||
    id.startsWith('herbivore_') ||
    id === 'even_doors_empty' ||
    id === 'odd_doors_empty' ||
    id === 'two_doors_occupied' ||
    id.startsWith('women_adj_')
  ) {
    return 'board';
  }

  return 'relational';
}

function generateCandidateCluesForSuspect(speakerId, grid, vasePos, vaseRoom, doors, topo) {
  const clues = [];
  const speaker = SUSPECTS[speakerId];
  const isFem = speaker.isCarnivore; // true = Mujer (Analista, Becaria), false = Hombre
  const {
    roomSizes,
    maxSize,
    minSize,
    largestRooms,
    smallestRooms,
    roomDoors,
    doorMap,
    cellTouchesRoomWall
  } = topo;

  // 1. UMBRAL / PUERTAS
  for (let dNum = 1; dNum <= 4; dNum++) {
    clues.push({
      id: `self_door_${dNum}`,
      category: 'Umbral',
      weight: 15,
      text: `Me quedé tomando un café junto a la **puerta ${dNum}**`,
      evalFn: (st) => st.doorOccupant[dNum] === speakerId
    });

    clues.push({
      id: `nobody_door_${dNum}`,
      category: 'Umbral',
      weight: 11,
      text: `Por la **puerta ${dNum}** no había **nadie** vigilando`,
      evalFn: (st) => st.doorOccupant[dNum] === -1
    });

    clues.push({
      id: `someone_door_${dNum}`,
      category: 'Umbral',
      weight: 11,
      text: `Había **alguien** cotilleando junto a la **puerta ${dNum}**`,
      evalFn: (st) => st.doorOccupant[dNum] !== -1
    });

    clues.push({
      id: `carnivore_door_${dNum}`,
      category: 'Umbral',
      weight: 14,
      text: `Había **una mujer** junto a la **puerta ${dNum}**`,
      evalFn: (st) => {
        const occ = st.doorOccupant[dNum];
        return occ !== -1 && SUSPECTS[occ].isCarnivore;
      }
    });

    clues.push({
      id: `herbivore_door_${dNum}`,
      category: 'Umbral',
      weight: 13,
      text: `Había **un hombre** plantado junto a la **puerta ${dNum}**`,
      evalFn: (st) => {
        const occ = st.doorOccupant[dNum];
        return occ !== -1 && !SUSPECTS[occ].isCarnivore;
      }
    });

    for (let otherId = 0; otherId < 5; otherId++) {
      if (otherId === speakerId) continue;
      const otherIsFem = SUSPECTS[otherId].isCarnivore;
      clues.push({
        id: `other_${otherId}_door_${dNum}`,
        category: 'Umbral',
        weight: 15,
        text: `Pillé a **${SUSPECTS[otherId].name}** ${otherIsFem ? 'pegada' : 'pegado'} a la **puerta ${dNum}**`,
        evalFn: (st) => st.doorOccupant[dNum] === otherId
      });
    }
  }

  clues.push({
    id: `self_even_door`,
    category: 'Umbral',
    weight: 14,
    text: `Me quedé vigilando una **puerta par (2 o 4)**`,
    evalFn: (st) => st.doorOccupant[2] === speakerId || st.doorOccupant[4] === speakerId
  });

  clues.push({
    id: `self_odd_door`,
    category: 'Umbral',
    weight: 14,
    text: `Estaba junto a una **puerta impar (1 o 3)**`,
    evalFn: (st) => st.doorOccupant[1] === speakerId || st.doorOccupant[3] === speakerId
  });

  clues.push({
    id: `self_no_door`,
    category: 'Umbral',
    weight: 13,
    text: `Yo pasé de cotillear: **no estaba en ninguna puerta** numerada`,
    evalFn: (st) => st.suspectDoors[speakerId].length === 0
  });

  clues.push({
    id: `even_doors_empty`,
    category: 'Umbral',
    weight: 15,
    text: `Las **puertas pares (2 y 4)** estaban completamente **desiertas**`,
    evalFn: (st) => st.doorOccupant[2] === -1 && st.doorOccupant[4] === -1
  });

  clues.push({
    id: `odd_doors_empty`,
    category: 'Umbral',
    weight: 15,
    text: `No había **nadie** vigilando las **puertas impares (1 y 3)**`,
    evalFn: (st) => st.doorOccupant[1] === -1 && st.doorOccupant[3] === -1
  });

  clues.push({
    id: `two_doors_occupied`,
    category: 'Umbral',
    weight: 14,
    text: `En total había exactamente **2 puertas numeradas** con gente vigilando`,
    evalFn: (st) =>
      [1, 2, 3, 4].filter((d) => st.doorOccupant[d] !== -1).length === 2
  });

  clues.push({
    id: `room_dead_end`,
    category: 'Umbral',
    weight: 15,
    text: `Mi despacho es una ratonera: solo tiene **1 puerta numerada**`,
    evalFn: (st) => roomDoors[st.suspectRoom[speakerId]].length === 1
  });

  clues.push({
    id: `room_multi_doors`,
    category: 'Umbral',
    weight: 13,
    text: `Mi despacho parece un pasillo, tiene **al menos 2 puertas** numeradas`,
    evalFn: (st) => roomDoors[st.suspectRoom[speakerId]].length >= 2
  });

  clues.push({
    id: `room_no_even_doors`,
    category: 'Umbral',
    weight: 14,
    text: `En los muros de mi despacho **no hay ninguna puerta par**`,
    evalFn: (st) => {
      const dList = roomDoors[st.suspectRoom[speakerId]];
      return !dList.includes(2) && !dList.includes(4);
    }
  });

  clues.push({
    id: `room_no_odd_doors`,
    category: 'Umbral',
    weight: 14,
    text: `En los muros de mi despacho **no hay ninguna puerta impar**`,
    evalFn: (st) => {
      const dList = roomDoors[st.suspectRoom[speakerId]];
      return !dList.includes(1) && !dList.includes(3);
    }
  });

  for (let dNum = 1; dNum <= 4; dNum++) {
    const [rA, rB] = doorMap[dNum];
    for (let otherId = 0; otherId < 5; otherId++) {
      if (otherId === speakerId) continue;
      clues.push({
        id: `conn_${otherId}_door_${dNum}`,
        category: 'Umbral',
        weight: 14,
        text: `La **puerta ${dNum}** conecta mi despacho con el de **${SUSPECTS[otherId].name}**`,
        evalFn: (st) => {
          const rm1 = st.suspectRoom[speakerId];
          const rm2 = st.suspectRoom[otherId];
          return (rm1 === rA && rm2 === rB) || (rm1 === rB && rm2 === rA);
        }
      });
    }
  }

  if (isFem) {
    const otherCarnivore = SUSPECTS.find((s) => s.isCarnivore && s.id !== speakerId);
    if (otherCarnivore) {
      const otherCarnivoreId = otherCarnivore.id;
      clues.push({
        id: `other_carnivore_even_door`,
        category: 'Umbral',
        weight: 16,
        text: `Una **puerta par** comunica mi despacho con el de la **otra mujer**`,
        evalFn: (st) => {
          const rm1 = st.suspectRoom[speakerId];
          const rm2 = st.suspectRoom[otherCarnivoreId];
          const [r2A, r2B] = doorMap[2];
          const [r4A, r4B] = doorMap[4];
          const via2 = (rm1 === r2A && rm2 === r2B) || (rm1 === r2B && rm2 === r2A);
          const via4 = (rm1 === r4A && rm2 === r4B) || (rm1 === r4B && rm2 === r4A);
          return via2 || via4;
        }
      });

      clues.push({
        id: `other_carnivore_odd_door`,
        category: 'Umbral',
        weight: 16,
        text: `Una **puerta impar** comunica mi despacho con el de la **otra mujer**`,
        evalFn: (st) => {
          const rm1 = st.suspectRoom[speakerId];
          const rm2 = st.suspectRoom[otherCarnivoreId];
          const [r1A, r1B] = doorMap[1];
          const [r3A, r3B] = doorMap[3];
          const via1 = (rm1 === r1A && rm2 === r1B) || (rm1 === r1B && rm2 === r1A);
          const via3 = (rm1 === r3A && rm2 === r3B) || (rm1 === r3B && rm2 === r3A);
          return via1 || via3;
        }
      });
    }
  }

  // 2. FACHADA / CARDINAL
  clues.push({
    id: `facade_north`,
    category: 'Fachada',
    weight: 16,
    text: `Estaba ${isFem ? 'pegada' : 'pegado'} al ventanal **Norte** de la oficina`,
    evalFn: (st) => st.suspectRow[speakerId] === 0
  });

  clues.push({
    id: `facade_south`,
    category: 'Fachada',
    weight: 16,
    text: `Me quedé junto a la fachada **Sur** del edificio`,
    evalFn: (st) => st.suspectRow[speakerId] === 4
  });

  clues.push({
    id: `facade_west`,
    category: 'Fachada',
    weight: 16,
    text: `Me encontraba junto a la fachada **Oeste** de la oficina`,
    evalFn: (st) => st.suspectCol[speakerId] === 0
  });

  clues.push({
    id: `facade_east`,
    category: 'Fachada',
    weight: 16,
    text: `Estaba junto a la fachada **Este**, donde da el sol`,
    evalFn: (st) => st.suspectCol[speakerId] === 4
  });

  clues.push({
    id: `facade_corner`,
    category: 'Fachada',
    weight: 17,
    text: `Me escaqueé en una de las **4 esquinas exteriores** de la planta`,
    evalFn: (st) =>
      (st.suspectRow[speakerId] === 0 || st.suspectRow[speakerId] === 4) &&
      (st.suspectCol[speakerId] === 0 || st.suspectCol[speakerId] === 4)
  });

  clues.push({
    id: `facade_interior`,
    category: 'Fachada',
    weight: 15,
    text: `Estaba en el **interior de la oficina**, sin tocar ninguna fachada exterior`,
    evalFn: (st) =>
      st.suspectRow[speakerId] > 0 &&
      st.suspectRow[speakerId] < 4 &&
      st.suspectCol[speakerId] > 0 &&
      st.suspectCol[speakerId] < 4
  });

  clues.push({
    id: `south_half_rows`,
    category: 'Fachada',
    weight: 14,
    text: `Estaba ${isFem ? 'sentada' : 'sentado'} en las **2 últimas filas del Sur**`,
    evalFn: (st) => st.suspectRow[speakerId] >= 3
  });

  clues.push({
    id: `central_axes`,
    category: 'Fachada',
    weight: 15,
    text: `Mi mesa estaba en el **pasillo central** (**fila o columna del medio**)`,
    evalFn: (st) => st.suspectRow[speakerId] === 2 || st.suspectCol[speakerId] === 2
  });

  clues.push({
    id: `main_diagonals`,
    category: 'Fachada',
    weight: 15,
    text: `Estaba ${isFem ? 'situada' : 'situado'} en una de las **dos diagonales principales** del plano`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return r === c || r + c === 4;
    }
  });

  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;
    const otherIsFem = SUSPECTS[otherId].isCarnivore;

    clues.push({
      id: `more_north_than_${otherId}`,
      category: 'Fachada',
      weight: 14,
      text: `Yo estaba ${isFem ? 'situada' : 'situado'} más al **Norte** que **${SUSPECTS[otherId].name}**`,
      evalFn: (st) => st.suspectRow[speakerId] < st.suspectRow[otherId]
    });

    clues.push({
      id: `more_west_than_${otherId}`,
      category: 'Fachada',
      weight: 14,
      text: `Mi sitio estaba más al **Oeste** que el de **${SUSPECTS[otherId].name}**`,
      evalFn: (st) => st.suspectCol[speakerId] < st.suspectCol[otherId]
    });

    clues.push({
      id: `other_on_border_${otherId}`,
      category: 'Fachada',
      weight: 14,
      text: `Vi a **${SUSPECTS[otherId].name}** ${otherIsFem ? 'pegada' : 'pegado'} a una **fachada exterior** de la oficina`,
      evalFn: (st) => {
        const r = st.suspectRow[otherId];
        const c = st.suspectCol[otherId];
        return r === 0 || r === 4 || c === 0 || c === 4;
      }
    });
  }

  // 3. CLAUSTROFOBIA / TAMAÑO
  if (largestRooms.length === 1) {
    clues.push({
      id: `self_largest_room`,
      category: 'Claustrofobia',
      weight: 16,
      text: `Me instalé en el **despacho más grande** de todos (**${maxSize} casillas**)`,
      evalFn: (st) => st.suspectRoom[speakerId] === largestRooms[0]
    });
  }

  if (smallestRooms.length === 1) {
    clues.push({
      id: `self_smallest_room`,
      category: 'Claustrofobia',
      weight: 16,
      text: `Me encerraron en el **despacho más pequeño** de la oficina (**${minSize} casillas**)`,
      evalFn: (st) => st.suspectRoom[speakerId] === smallestRooms[0]
    });
  }

  const uniqueSizes = Array.from(new Set(roomSizes));
  for (const sz of uniqueSizes) {
    clues.push({
      id: `self_room_size_${sz}`,
      category: 'Claustrofobia',
      weight: 15,
      text: `Mi despacho mide exactamente **${sz} casillas**, las conté`,
      evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] === sz
    });
  }

  clues.push({
    id: `self_room_even_size`,
    category: 'Claustrofobia',
    weight: 13,
    text: `Mi despacho tiene un **número par de casillas**`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] % 2 === 0
  });

  clues.push({
    id: `self_room_odd_size`,
    category: 'Claustrofobia',
    weight: 13,
    text: `Mi despacho tiene un **número impar de casillas**`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] % 2 !== 0
  });

  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;
    clues.push({
      id: `bigger_room_than_${otherId}`,
      category: 'Claustrofobia',
      weight: 14,
      text: `Mi despacho tiene **más casillas** que el de **${SUSPECTS[otherId].name}**`,
      evalFn: (st) =>
        roomSizes[st.suspectRoom[speakerId]] > roomSizes[st.suspectRoom[otherId]]
    });

    clues.push({
      id: `same_room_size_as_${otherId}`,
      category: 'Claustrofobia',
      weight: 15,
      text: `Mi despacho mide **exactamente las mismas casillas** que el de **${SUSPECTS[otherId].name}**`,
      evalFn: (st) =>
        roomSizes[st.suspectRoom[speakerId]] === roomSizes[st.suspectRoom[otherId]]
    });
  }

  // 4. CONTACTO CON ESCENARIO
  clues.push({
    id: `adj_to_vase_orth`,
    category: 'Escenario',
    weight: 18,
    text: `Tenía el mismísimo **sándwich** directamente en uno de mis cuatro costados`,
    evalFn: (st) =>
      Math.abs(st.suspectRow[speakerId] - vasePos.r) +
        Math.abs(st.suspectCol[speakerId] - vasePos.c) ===
      1
  });

  clues.push({
    id: `adj_to_vase_king`,
    category: 'Escenario',
    weight: 17,
    text: `Podía oler el **sándwich** desde mi sitio, estaba a un paso`,
    evalFn: (st) =>
      Math.abs(st.suspectRow[speakerId] - vasePos.r) <= 1 &&
      Math.abs(st.suspectCol[speakerId] - vasePos.c) <= 1
  });

  clues.push({
    id: `same_line_as_vase`,
    category: 'Escenario',
    weight: 16,
    text: `Desde mi silla veía el **sándwich** en mi **misma fila o columna**`,
    evalFn: (st) =>
      st.suspectRow[speakerId] === vasePos.r || st.suspectCol[speakerId] === vasePos.c
  });

  clues.push({
    id: `no_line_as_vase`,
    category: 'Escenario',
    weight: 13,
    text: `El **sándwich** no estaba **ni en mi fila ni en mi columna**`,
    evalFn: (st) =>
      st.suspectRow[speakerId] !== vasePos.r && st.suspectCol[speakerId] !== vasePos.c
  });

  clues.push({
    id: `knight_to_vase`,
    category: 'Escenario',
    weight: 17,
    text: `Mi silla estaba a un **salto de caballo (en L)** del **sándwich**`,
    evalFn: (st) => {
      const dr = Math.abs(st.suspectRow[speakerId] - vasePos.r);
      const dc = Math.abs(st.suspectCol[speakerId] - vasePos.c);
      return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
    }
  });

  clues.push({
    id: `touch_many_rooms`,
    category: 'Escenario',
    weight: 15,
    text: `Desde mi casilla tocaba los tabiques de **al menos 2 despachos ajenos**`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return cellTouchesRoomWall[r][c].size >= 2;
    }
  });

  clues.push({
    id: `deep_inside_room`,
    category: 'Escenario',
    weight: 16,
    text: `En mi casilla estaba ${isFem ? 'aislada' : 'aislado'}: **no tocaba el tabique** de ningún otro despacho`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return cellTouchesRoomWall[r][c].size === 0;
    }
  });

  for (let rm = 0; rm < 5; rm++) {
    const rmName = ROOMS[rm].name.toLowerCase();
    clues.push({
      id: `touch_wall_of_room_${rm}`,
      category: 'Escenario',
      weight: 16,
      text: `Estaba fuera del **despacho ${rmName}**, junto a su pared`,
      evalFn: (st) => {
        const r = st.suspectRow[speakerId];
        const c = st.suspectCol[speakerId];
        return cellTouchesRoomWall[r][c].has(rm);
      }
    });
  }

  // 5. PARANOIA CRUZADA
  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;
    clues.push({
      id: `accuse_${otherId}`,
      category: 'Paranoia',
      weight: 15,
      text: `¡**${SUSPECTS[otherId].name}** **miente** descaradamente, tiene migas en la ropa!`,
      evalFn: (st) => st.suspectRoom[otherId] === vaseRoom
    });

    clues.push({
      id: `vouch_${otherId}`,
      category: 'Paranoia',
      weight: 13,
      text: `Pongo la mano en el fuego por **${SUSPECTS[otherId].name}**: **dice la verdad**`,
      evalFn: (st) => st.suspectRoom[otherId] !== vaseRoom
    });
  }

  clues.push({
    id: `thief_is_carnivore`,
    category: 'Paranoia',
    weight: 16,
    text: `El **ladrón** del almuerzo es **una mujer**, la vi abrir el tupper`,
    evalFn: (st) => SUSPECTS[st.roomSuspect[vaseRoom]].isCarnivore
  });

  clues.push({
    id: `thief_is_herbivore`,
    category: 'Paranoia',
    weight: 15,
    text: `Quien se zampó el **sándwich** es **un hombre**`,
    evalFn: (st) => !SUSPECTS[st.roomSuspect[vaseRoom]].isCarnivore
  });

  clues.push({
    id: `thief_on_north_half`,
    category: 'Paranoia',
    weight: 16,
    text: `El **ladrón** se esconde en las **2 primeras filas del Norte**`,
    evalFn: (st) => st.suspectRow[st.roomSuspect[vaseRoom]] <= 1
  });

  clues.push({
    id: `thief_on_south_half`,
    category: 'Paranoia',
    weight: 16,
    text: `El **ladrón** se esconde en las **2 últimas filas del Sur**`,
    evalFn: (st) => st.suspectRow[st.roomSuspect[vaseRoom]] >= 3
  });

  clues.push({
    id: `thief_at_some_door`,
    category: 'Paranoia',
    weight: 16,
    text: `El **ladrón** estaba apostado junto a una de las **4 puertas numeradas**`,
    evalFn: (st) => {
      const thiefInS = st.roomSuspect[vaseRoom];
      return st.suspectDoors[thiefInS].length > 0;
    }
  });

  clues.push({
    id: `thief_at_no_door`,
    category: 'Paranoia',
    weight: 15,
    text: `El **ladrón** evitó ponerse junto a las **puertas numeradas**`,
    evalFn: (st) => {
      const thiefInS = st.roomSuspect[vaseRoom];
      return st.suspectDoors[thiefInS].length === 0;
    }
  });

  clues.push({
    id: `thief_on_perimeter`,
    category: 'Paranoia',
    weight: 15,
    text: `El **ladrón** estaba junto a una **fachada exterior** del edificio`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      const r = st.suspectRow[thief];
      const c = st.suspectCol[thief];
      return r === 0 || r === 4 || c === 0 || c === 4;
    }
  });

  clues.push({
    id: `thief_in_interior`,
    category: 'Paranoia',
    weight: 16,
    text: `El **ladrón** actuó desde el **interior de la planta**, lejos de las fachadas`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      const r = st.suspectRow[thief];
      const c = st.suspectCol[thief];
      return r > 0 && r < 4 && c > 0 && c < 4;
    }
  });

  // 6. DESPACHO / DIETA
  for (let rm = 0; rm < 5; rm++) {
    const rmName = ROOMS[rm].name.toLowerCase();

    clues.push({
      id: `self_in_room_${rm}`,
      category: 'Despacho',
      weight: 9,
      text: `Yo estaba trabajando tranquilamente en el **despacho ${rmName}**`,
      evalFn: (st) => st.suspectRoom[speakerId] === rm
    });

    clues.push({
      id: `carnivore_in_room_${rm}`,
      category: 'Despacho',
      weight: 11,
      text: `El **despacho ${rmName}** lo ocupaba **una mujer**`,
      evalFn: (st) => SUSPECTS[st.roomSuspect[rm]].isCarnivore
    });

    clues.push({
      id: `herbivore_in_room_${rm}`,
      category: 'Despacho',
      weight: 9,
      text: `El **despacho ${rmName}** lo ocupaba **un hombre**`,
      evalFn: (st) => !SUSPECTS[st.roomSuspect[rm]].isCarnivore
    });

    for (let otherId = 0; otherId < 5; otherId++) {
      if (otherId === speakerId) continue;
      clues.push({
        id: `other_${otherId}_in_room_${rm}`,
        category: 'Despacho',
        weight: 11,
        text: `Vi a **${SUSPECTS[otherId].name}** dentro del **despacho ${rmName}**`,
        evalFn: (st) => st.suspectRoom[otherId] === rm
      });
    }
  }

  clues.push({
    id: `women_adj_rows`,
    category: 'Despacho',
    weight: 13,
    text: isFem
      ? `Las **dos mujeres** de la oficina estábamos en **filas vecinas**`
      : `Las **dos mujeres** de la oficina estaban en **filas vecinas**`,
    evalFn: (st) => {
      const women = SUSPECTS.filter((s) => s.isCarnivore).map((s) => s.id);
      return Math.abs(st.suspectRow[women[0]] - st.suspectRow[women[1]]) === 1;
    }
  });

  clues.push({
    id: `women_adj_cols`,
    category: 'Despacho',
    weight: 13,
    text: isFem
      ? `Las **dos mujeres** ocupábamos **columnas vecinas**`
      : `Las **dos mujeres** ocupaban **columnas vecinas**`,
    evalFn: (st) => {
      const women = SUSPECTS.filter((s) => s.isCarnivore).map((s) => s.id);
      return Math.abs(st.suspectCol[women[0]] - st.suspectCol[women[1]]) === 1;
    }
  });

  return clues.map((c) => ({
    ...c,
    role: getClueRole(c)
  }));
}

function generateCompleteLevel(enabledCategories = null, seed = null) {
  // Si no se pasa semilla (modo aleatorio), creamos una de 6 dígitos para poder compartirla
  const actualSeed =
    seed !== null ? seed : Math.floor(100000 + Math.random() * 900000);
  const rng = createPrng(actualSeed);
  const startTime = performance.now();
  let mapAttempts = 0;

  const categoriesToUse =
    enabledCategories && enabledCategories.length > 0
      ? enabledCategories
      : shuffle(Object.keys(CLUE_CATEGORIES), rng).slice(0, 3);

  const activeCatSet = new Set(categoriesToUse);

  while (mapAttempts < 280) {
    mapAttempts++;

    const solGeoIdx = Math.floor(rng() * BASE_GEOMETRIES.length);
    const solGeo = BASE_GEOMETRIES[solGeoIdx];

    const roomData = generateRoomsAndVase(solGeo, rng);
    if (!roomData) continue;
    const { grid, vasePos, vaseRoom } = roomData;

    const survivingGeos = getSurvivingGeometries(grid, vasePos);
    const K = survivingGeos.length;
    if (K < 2 || K > 6) continue;

    const doors = placeStrategicDoors(grid, vasePos, survivingGeos, rng);
    if (!doors) continue;

    const topo = analyzeMapTopology(grid, vasePos, doors);

    const solPerm = shuffle([0, 1, 2, 3, 4], rng);
    const states = [];
    let trueStateIdx = -1;

    survivingGeos.forEach(({ idx: gIdx, geo }) => {
      PERMUTATIONS_120.forEach((perm) => {
        const st = buildStateObject(gIdx, geo, perm, grid, doors);
        if (
          gIdx === solGeoIdx &&
          perm[0] === solPerm[0] &&
          perm[1] === solPerm[1] &&
          perm[2] === solPerm[2] &&
          perm[3] === solPerm[3] &&
          perm[4] === solPerm[4]
        ) {
          trueStateIdx = states.length;
        }
        states.push(st);
      });
    });

    const N = states.length;
    const trueState = states[trueStateIdx];
    const thiefId = trueState.roomSuspect[vaseRoom];

    const validPools = [];
    let poolEmpty = false;
    let anySuspectHasAnchor = false;

    for (let sId = 0; sId < 5; sId++) {
      const rawClues = generateCandidateCluesForSuspect(
        sId,
        grid,
        vasePos,
        vaseRoom,
        doors,
        topo
      );
      const isThiefInTrue = sId === thiefId;
      const filtered = [];

      for (const clue of rawClues) {
        if (!activeCatSet.has(clue.category)) continue;
        if (clue.id === `self_in_room_${vaseRoom}`) continue;

        const truthInTrueState = clue.evalFn(trueState);
        if (truthInTrueState !== !isThiefInTrue) continue;

        const compatIndices = [];
        let trueWhenInnocentCount = 0;

        for (let i = 0; i < N; i++) {
          const st = states[i];
          const isThiefInS = st.suspectRoom[sId] === vaseRoom;
          const evalRes = clue.evalFn(st);
          if (!isThiefInS && evalRes) {
            trueWhenInnocentCount++;
          }
          if (evalRes === !isThiefInS) {
            compatIndices.push(i);
          }
        }

        // Evita que el ladrón use mentiras físicamente imposibles en el mapa actual
        if (trueWhenInnocentCount === 0) continue;

        if (compatIndices.length >= 2 && compatIndices.length < N * 0.88) {
          filtered.push({
            ...clue,
            compatSet: new Set(compatIndices),
            compatCount: compatIndices.length,
            sortScore: (compatIndices.length / clue.weight) * (0.85 + rng() * 0.3)
          });
        }
      }

      if (filtered.length === 0) {
        poolEmpty = true;
        break;
      }

      if (filtered.some((c) => c.role === 'anchor')) {
        anySuspectHasAnchor = true;
      }

      validPools.push(
        shuffle(filtered, rng).sort((a, b) => a.sortScore - b.sortScore)
      );
    }

    if (poolEmpty || !anySuspectHasAnchor) continue;

    let chosenClues = null;

    for (let searchTry = 0; searchTry < 110; searchTry++) {
      // Cualquier sospechoso con pistas 'anchor' puede abrir la deducción (desencajona a la Analista)
      const anchorCapableSuspects = [0, 1, 2, 3, 4].filter((sId) =>
        validPools[sId].some((c) => c.role === 'anchor')
      );
      const firstSuspect =
        anchorCapableSuspects[Math.floor(rng() * anchorCapableSuspects.length)];
      const remainingSuspects = shuffle(
        [0, 1, 2, 3, 4].filter((sId) => sId !== firstSuspect),
        rng
      );
      const order = [firstSuspect, ...remainingSuspects];

      let survivors = Array.from({ length: N }, (_, i) => i);
      const pickBySuspect = new Array(5);
      const usedCategories = new Set();
      const usedClueIds = new Set();

      let anchorCount = 0;
      let boardCount = 0;
      let paranoiaCount = 0;
      let relationalCount = 0;

      for (let step = 0; step < 5; step++) {
        const sId = order[step];
        const pool = validPools[sId];
        let bestClue = null;
        let bestScore = Infinity;

        const sampleLimit = Math.min(pool.length, 48);
        for (let k = 0; k < sampleLimit; k++) {
          const cand = pool[k];

          // Evitar que dos sospechosos repitan exactamente la misma coartada
          if (usedClueIds.has(cand.id)) continue;

          // 1. El primer sospechoso evaluado SIEMPRE lleva pista 'anchor'
          if (step === 0 && cand.role !== 'anchor') continue;

          // 2. Máximo 3 pistas 'anchor' en total
          if (cand.role === 'anchor' && anchorCount >= 3) continue;

          // 3. Máximo 1 pista de 'paranoia' por partida
          if (cand.role === 'paranoia' && paranoiaCount >= 1) continue;

          // 4. Evitar el "efecto de los 3 ciegos": máximo 2 pistas relacionales/paranoia en total
          if (
            (cand.role === 'relational' || cand.role === 'paranoia') &&
            relationalCount + paranoiaCount >= 2
          ) {
            continue;
          }

          let nextCount = 0;
          for (let idx = 0; idx < survivors.length; idx++) {
            if (cand.compatSet.has(survivors[idx])) {
              nextCount++;
            }
          }

          if (nextCount === 0) continue;

          let score = nextCount;
          // Evitar cerrar el puzle antes del 5.º sospechoso (step < 4)
          if (step < 4 && nextCount === 1) {
            score += 65;
          }
          if (!usedCategories.has(cand.category)) {
            score -= 12;
          }
          if (cand.category !== 'Despacho') {
            score -= 3;
          }
          // Priorizar alcanzar al menos 2 anclas y 1 pista de tablero sin saturar el último turno
          if (cand.role === 'anchor' && anchorCount < 2) {
            score -= 8;
          } else if (cand.role === 'board' && boardCount < 1) {
            score -= 5;
          }

          const jitter = Math.max(6, survivors.length * 0.18);
          score += rng() * jitter;

          if (score < bestScore) {
            bestScore = score;
            bestClue = cand;
          }
        }

        if (!bestClue) break;
        pickBySuspect[sId] = bestClue;
        usedCategories.add(bestClue.category);
        usedClueIds.add(bestClue.id);

        if (bestClue.role === 'anchor') anchorCount++;
        else if (bestClue.role === 'board') boardCount++;
        else if (bestClue.role === 'paranoia') paranoiaCount++;
        else relationalCount++;

        survivors = survivors.filter((idx) => bestClue.compatSet.has(idx));
      }

      if (
        !pickBySuspect.includes(undefined) &&
        survivors.length === 1 &&
        survivors[0] === trueStateIdx
      ) {
        const minDistinct = Math.min(3, activeCatSet.size);
        if (
          usedCategories.size >= minDistinct &&
          pickBySuspect[firstSuspect].role === 'anchor' &&
          anchorCount >= 2 &&
          anchorCount <= 3 &&
          anchorCount + boardCount >= 3
        ) {
          chosenClues = pickBySuspect;
          break;
        }
      }
    }

    if (chosenClues) {
      let runningSurvivors = Array.from({ length: N }, (_, i) => i);
      const
