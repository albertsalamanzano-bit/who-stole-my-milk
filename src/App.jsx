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
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
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

  return clues;
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
        for (let i = 0; i < N; i++) {
          const st = states[i];
          const isThiefInS = st.suspectRoom[sId] === vaseRoom;
          if (clue.evalFn(st) === !isThiefInS) {
            compatIndices.push(i);
          }
        }

        if (compatIndices.length >= 2 && compatIndices.length < N * 0.88) {
          filtered.push({
            ...clue,
            compatSet: new Set(compatIndices),
            compatCount: compatIndices.length
          });
        }
      }

      if (filtered.length === 0) {
        poolEmpty = true;
        break;
      }

      validPools.push(
        shuffle(filtered, rng).sort(
          (a, b) => a.compatCount / a.weight - b.compatCount / b.weight
        )
      );
    }

    if (poolEmpty) continue;

    let chosenClues = null;

    for (let searchTry = 0; searchTry < 95; searchTry++) {
      const order = shuffle([0, 1, 2, 3, 4], rng);
      let survivors = Array.from({ length: N }, (_, i) => i);
      const pickBySuspect = new Array(5);
      const usedCategories = new Set();

      for (let step = 0; step < 5; step++) {
        const sId = order[step];
        const pool = validPools[sId];
        let bestClue = null;
        let bestScore = Infinity;

        const sampleLimit = Math.min(pool.length, 36);
        for (let k = 0; k < sampleLimit; k++) {
          const cand = pool[k];
          let nextCount = 0;
          for (let idx = 0; idx < survivors.length; idx++) {
            if (cand.compatSet.has(survivors[idx])) {
              nextCount++;
            }
          }

          let score = nextCount;
          if (step < 3 && nextCount === 1) {
            score += 65;
          }
          if (!usedCategories.has(cand.category)) {
            score -= 12;
          }
          if (cand.category !== 'Despacho') {
            score -= 5;
          }
          score += rng() * 3;

          if (score < bestScore) {
            bestScore = score;
            bestClue = cand;
          }
        }

        if (!bestClue) break;
        pickBySuspect[sId] = bestClue;
        usedCategories.add(bestClue.category);
        survivors = survivors.filter((idx) => bestClue.compatSet.has(idx));
      }

      if (survivors.length === 1 && survivors[0] === trueStateIdx) {
        const minDistinct = Math.min(3, activeCatSet.size);
        if (usedCategories.size >= minDistinct) {
          chosenClues = pickBySuspect;
          break;
        }
      }
    }

    if (chosenClues) {
      let runningSurvivors = Array.from({ length: N }, (_, i) => i);
      const clueCascade = [];
      for (let sId = 0; sId < 5; sId++) {
        runningSurvivors = runningSurvivors.filter((idx) =>
          chosenClues[sId].compatSet.has(idx)
        );
        clueCascade.push({
          suspectId: sId,
          remainingStates: runningSurvivors.length
        });
      }

      const clueImpact = [];
      for (let sId = 0; sId < 5; sId++) {
        let withoutThis = Array.from({ length: N }, (_, i) => i);
        for (let other = 0; other < 5; other++) {
          if (other === sId) continue;
          withoutThis = withoutThis.filter((idx) =>
            chosenClues[other].compatSet.has(idx)
          );
        }
        clueImpact.push(withoutThis.length);
      }

      const elapsedMs = Math.max(1, Math.round(performance.now() - startTime));

      return {
        seed: actualSeed,
        caseNumber: actualSeed,
        elapsedMs,
        mapAttempts,
        categories: categoriesToUse,
        grid,
        roomSizes: topo.roomSizes,
        vasePos,
        vaseRoom,
        doors,
        solGeoIdx,
        solGeo,
        trueState,
        thiefId,
        survivingGeos,
        totalStates: N,
        clues: chosenClues.map((c, sId) => ({
          suspectId: sId,
          category: c.category,
          text: c.text,
          evalFn: c.evalFn,
          statesWithoutThisClue: clueImpact[sId]
        })),
        clueCascade
      };
    }
  }

  return null;
}

// ============================================================================
// 4. COMPONENTE PRINCIPAL DE LA APLICACIÓN
// ============================================================================

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDark(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const dailyConfig = useMemo(() => getDailyConfig(), []);
  const yesterdayConfig = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getDailyConfig(yesterday);
  }, []);

  const dailyStorageKey = `sandwich_daily_state_${dailyConfig.seed}`;

  const initialDailySaved = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(dailyStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }, [dailyStorageKey]);

  // Si la URL incluye ?caso=123456, arrancamos directamente en ese nivel compartido
  const initialUrlSeed = useMemo(() => getSeedFromUrl(), []);

  const [isDailyMode, setIsDailyMode] = useState(() => initialUrlSeed === null);

  const [level, setLevel] = useState(() => {
    if (initialUrlSeed !== null) {
      const sharedLevel = generateCompleteLevel(null, initialUrlSeed);
      if (sharedLevel) return sharedLevel;
    }
    return generateCompleteLevel(dailyConfig.categories, dailyConfig.seed);
  });

  const [placements, setPlacements] = useState(() =>
    initialUrlSeed !== null ? {} : initialDailySaved?.placements || {}
  );
  const [activeSuspect, setActiveSuspect] = useState(0);
  const [suspectedLiar, setSuspectedLiar] = useState(() =>
    initialUrlSeed !== null ? null : initialDailySaved?.suspectedLiar ?? null
  );
  const [seconds, setSeconds] = useState(() =>
    initialUrlSeed !== null ? 0 : initialDailySaved?.seconds || 0
  );

  const [isSolved, setIsSolved] = useState(() =>
    initialUrlSeed !== null ? false : Boolean(initialDailySaved?.completed)
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  // Abrir «Reglas» automáticamente el primer día
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const seen = localStorage.getItem('sandwich_rules_seen');
      if (!seen) {
        localStorage.setItem('sandwich_rules_seen', 'true');
        return true;
      }
      return false;
    } catch (_e) {
      return false;
    }
  });

  const [copiedShare, setCopiedShare] = useState(false);

  // --- ESTADOS DEL RANKING DIARIO (HOY Y AYER) ---
  const [modalTab, setModalTab] = useState('share'); // 'share' | 'leaderboard'
  const [leaderboardDay, setLeaderboardDay] = useState('today'); // 'today' | 'yesterday'
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('sandwich_detective_name') || '';
  });
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(() =>
    Boolean(initialDailySaved?.scoreSubmitted)
  );
  const [submittedEntryId, setSubmittedEntryId] = useState(
    () => initialDailySaved?.submittedEntryId || null
  );
  const [submitError, setSubmitError] = useState('');

  const [countdown, setCountdown] = useState(() => getTimeUntilMidnight());

  const isAnyModalOpen = isHelpModalOpen || isModeModalOpen || isShareModalOpen;

  // Sincroniza el color de fondo de html/body y theme-color (incluyendo sombra de popups en barras del navegador)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const baseBg = isDark ? '#14161B' : '#F3F4F6';
    const modalBg = isDark ? '#050608' : '#3D3F45';
    const activeColor = isAnyModalOpen ? modalBg : baseBg;

    document.documentElement.style.backgroundColor = activeColor;
    document.body.style.backgroundColor = activeColor;

    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.name = 'theme-color';
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', activeColor);
  }, [isDark, isAnyModalOpen]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isDailyMode || typeof window === 'undefined') return;
    try {
      const existingRaw = localStorage.getItem(dailyStorageKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : null;

      if (existing?.completed && !isSolved) return;

      const payload = {
        completed: isSolved,
        seconds: existing?.completed ? existing.seconds : seconds,
        placements: existing?.completed ? existing.placements : placements,
        suspectedLiar,
        scoreSubmitted: existing?.scoreSubmitted || scoreSubmitted,
        submittedEntryId: existing?.submittedEntryId || submittedEntryId
      };
      localStorage.setItem(dailyStorageKey, JSON.stringify(payload));
    } catch (_e) {
      // Ignorar errores de almacenamiento
    }
  }, [
    isDailyMode,
    isSolved,
    seconds,
    placements,
    suspectedLiar,
    scoreSubmitted,
    submittedEntryId,
    dailyStorageKey
  ]);

  const targetBoardSeed =
    leaderboardDay === 'today' ? dailyConfig.seed : yesterdayConfig.seed;

  const fetchLeaderboard = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingBoard(true);
    const { data, error } = await supabase
      .from('daily_leaderboard')
      .select('id, player_name, seconds, created_at')
      .eq('seed', targetBoardSeed)
      .order('seconds', { ascending: true })
      .limit(50);

    if (!error && data) {
      setLeaderboard(data);
    }
    setIsLoadingBoard(false);
  }, [targetBoardSeed]);

  useEffect(() => {
    if (isShareModalOpen && isDailyMode && isSolved) {
      fetchLeaderboard();
    }
  }, [isShareModalOpen, isDailyMode, isSolved, fetchLeaderboard]);

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!supabase || scoreSubmitted || isSubmittingScore) return;

    const cleanName = sanitizeText(playerName);

    if (cleanName.length < 2) {
      setSubmitError('Pon un apodo de al menos 2 letras.');
      return;
    }

    setIsSubmittingScore(true);
    setSubmitError('');

    const finalName = cleanName.slice(0, 18);
    const finalSeconds = Math.max(3, seconds);

    const { data, error } = await supabase
      .from('daily_leaderboard')
      .insert([
        {
          seed: dailyConfig.seed,
          player_name: finalName,
          comment: '',
          seconds: finalSeconds,
          thief_id: level.thiefId
        }
      ])
      .select('id')
      .single();

    setIsSubmittingScore(false);

    if (error) {
      setSubmitError('No se pudo guardar en el ranking. Revisa tu conexión.');
      return;
    }

    try {
      localStorage.setItem('sandwich_detective_name', finalName);
    } catch (_e) {
      // Ignorar
    }
    setPlayerName(finalName);
    if (data?.id) {
      setSubmittedEntryId(data.id);
    }
    setScoreSubmitted(true);
    setLeaderboardDay('today');
    fetchLeaderboard();
  };

  const handleLoadDaily = useCallback(() => {
    if (isDailyMode) {
      setIsModeModalOpen(false);
      return;
    }

    const nextLevel = generateCompleteLevel(dailyConfig.categories, dailyConfig.seed);
    if (!nextLevel) return;

    // Limpia el parámetro ?caso=... de la URL al volver al reto diario
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }

    setIsDailyMode(true);
    setLevel(nextLevel);
    setActiveSuspect(0);
    setIsModeModalOpen(false);
    setCopiedShare(false);

    try {
      const raw = localStorage.getItem(dailyStorageKey);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved) {
        setPlacements(saved.placements || {});
        setSuspectedLiar(saved.suspectedLiar ?? null);
        setSeconds(saved.seconds || 0);
        setIsSolved(Boolean(saved.completed));
        setScoreSubmitted(Boolean(saved.scoreSubmitted));
        setSubmittedEntryId(saved.submittedEntryId || null);
        return;
      }
    } catch (_e) {
      // Fallback
    }

    setPlacements({});
    setSuspectedLiar(null);
    setSeconds(0);
    setIsSolved(false);
    setScoreSubmitted(false);
    setSubmittedEntryId(null);
  }, [isDailyMode, dailyConfig, dailyStorageKey]);

  const handleNewRandomLevel = useCallback(() => {
    const nextLevel = generateCompleteLevel();
    if (nextLevel) {
      // Actualiza la URL con el código del caso aleatorio actual
      if (typeof window !== 'undefined') {
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}?caso=${nextLevel.seed}`
        );
      }

      setIsDailyMode(false);
      setLevel(nextLevel);
      setPlacements({});
      setSuspectedLiar(null);
      setActiveSuspect(0);
      setSeconds(0);
      setIsSolved(false);
      setIsShareModalOpen(false);
      setIsModeModalOpen(false);
      setCopiedShare(false);
      setModalTab('share');
    }
  }, []);

  const handleClearBoard = useCallback(() => {
    if (isSolved) return;
    setPlacements({});
    setSuspectedLiar(null);
  }, [isSolved]);

  const suspectPositions = useMemo(() => {
    const map = {};
    Object.entries(placements).forEach(([key, sId]) => {
      const [r, c] = key.split(',').map(Number);
      map[sId] = { r, c };
    });
    return map;
  }, [placements]);

  const invalidatedCells = useMemo(() => {
    const set = new Set();
    if (!level) return set;

    Object.entries(placements).forEach(([key]) => {
      const [sr, sc] = key.split(',').map(Number);
      const sRoom = level.grid[sr][sc];

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (r === sr && c === sc) continue;
          if (r === level.vasePos.r && c === level.vasePos.c) continue;
          const cellKey = `${r},${c}`;
          if (placements[cellKey] !== undefined) continue;

          const sameRow = r === sr;
          const sameCol = c === sc;
          const sameRoom = level.grid[r][c] === sRoom;
          const kingTouch = Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1;

          if (sameRow || sameCol || sameRoom || kingTouch) {
            set.add(cellKey);
          }
        }
      }
    });

    return set;
  }, [level, placements]);

  const validation = useMemo(() => {
    if (!level) return null;
    const conflicts = new Set();

    const entries = Object.entries(placements).map(([key, sId]) => {
      const [r, c] = key.split(',').map(Number);
      return { key, r, c, sId, room: level.grid[r][c] };
    });

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];
        if (
          a.r === b.r ||
          a.c === b.c ||
          a.room === b.room ||
          (Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1)
        ) {
          conflicts.add(a.key);
          conflicts.add(b.key);
        }
      }
    }

    let clueResults = null;
    let allCluesValid = false;

    if (entries.length === 5 && conflicts.size === 0) {
      const playerGeo = new Array(5);
      const playerPerm = new Array(5);
      entries.forEach(({ r, c, sId }) => {
        playerGeo[r] = c;
        playerPerm[r] = sId;
      });

      const playerState = buildStateObject(
        -1,
        playerGeo,
        playerPerm,
        level.grid,
        level.doors
      );

      clueResults = {};
      allCluesValid = true;

      level.clues.forEach((clue) => {
        const sId = clue.suspectId;
        const isInVaseRoom = playerState.suspectRoom[sId] === level.vaseRoom;
        const statementTruth = clue.evalFn(playerState);
        const isConsistent = statementTruth === !isInVaseRoom;
        clueResults[sId] = {
          statementTruth,
          isInVaseRoom,
          isConsistent
        };
        if (!isConsistent) {
          allCluesValid = false;
        }
      });
    }

    return {
      conflicts,
      clueResults,
      allCluesValid,
      placedCount: entries.length
    };
  }, [level, placements]);

  const gameWon = isSolved || Boolean(validation?.allCluesValid);
  const hasClueMismatch =
    validation?.placedCount === 5 &&
    validation?.conflicts.size === 0 &&
    !validation?.allCluesValid;

  useEffect(() => {
    if (validation?.allCluesValid && !isSolved) {
      setIsSolved(true);
      setModalTab('share');
      setLeaderboardDay('today');
      setIsShareModalOpen(true);
    }
  }, [validation, isSolved]);

  // El cronómetro se pausa si el caso está resuelto o si hay algún popup abierto
  useEffect(() => {
    if (gameWon || isAnyModalOpen) return;
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameWon, isAnyModalOpen]);

  const handleCellClick = (r, c) => {
    if (!level || gameWon) return;
    if (r === level.vasePos.r && c === level.vasePos.c) return;

    const key = `${r},${c}`;

    if (placements[key] !== undefined) {
      const removedSuspect = placements[key];
      const nextPlacements = { ...placements };
      delete nextPlacements[key];
      setPlacements(nextPlacements);
      setActiveSuspect(removedSuspect);
      return;
    }

    const nextPlacements = {};
    Object.entries(placements).forEach(([k, sId]) => {
      if (sId !== activeSuspect) {
        nextPlacements[k] = sId;
      }
    });
    nextPlacements[key] = activeSuspect;
    setPlacements(nextPlacements);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const shareText = useMemo(() => {
    const modeLabel = isDailyMode
      ? `Expediente diario (${dailyConfig.formattedDate})`
      : `Expediente nº ${level?.caseNumber ?? ''}`;

    const shareUrl = isDailyMode
      ? 'https://www.sandwichcase.io'
      : `https://www.sandwichcase.io/?caso=${level?.seed ?? ''}`;

    return `¡Alguien ha robado mi sándwich en la oficina!\n📂 ${modeLabel}\n🕵️‍♂️ Culpable cazado en ${formatTime(seconds)}\n\n¿Lo resuelves más rápido que yo? 👇\n${shareUrl}`;
  }, [isDailyMode, dailyConfig.formattedDate, level?.caseNumber, level?.seed, seconds]);

  const handleCopyShareText = () => {
    navigator.clipboard?.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleNativeOrWhatsAppShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch (_err) {
        // Fallback
      }
    }
    handleCopyShareText();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  // Identifica cuál es la fila del jugador en el Ranking para resaltarla
  const highlightedEntryId = useMemo(() => {
    if (!leaderboard.length) return null;
    if (submittedEntryId && leaderboard.some((e) => e.id === submittedEntryId)) {
      return submittedEntryId;
    }
    const cleanCurrentName = sanitizeText(playerName).slice(0, 18).toLowerCase();
    if (!cleanCurrentName) return null;

    if (leaderboardDay === 'today' && scoreSubmitted) {
      const exactMatch = leaderboard.find(
        (e) =>
          e.player_name?.toLowerCase() === cleanCurrentName &&
          e.seconds === Math.max(3, seconds)
      );
      if (exactMatch) return exactMatch.id;
    }

    const nameMatch = leaderboard.find(
      (e) => e.player_name?.toLowerCase() === cleanCurrentName
    );
    return nameMatch ? nameMatch.id : null;
  }, [leaderboard, submittedEntryId, playerName, leaderboardDay, scoreSubmitted, seconds]);

  const currentSuspect = SUSPECTS[activeSuspect];
  const currentClue = level?.clues.find((c) => c.suspectId === activeSuspect);

  // Pistas interactivas en el mapa: detecta despachos, puertas, fachadas y sospechosos mencionados en la coartada activa
  const activeClueHighlights = useMemo(() => {
    const rooms = new Set();
    const doors = new Set();
    const doorCells = new Set();
    const facades = new Set();
    const facadeCells = new Set();
    const suspects = new Set();

    if (!currentClue?.text || !level) {
      return { rooms, doors, doorCells, facades, facadeCells, suspects };
    }

    const lower = currentClue.text.toLowerCase();

    // 1. Despachos por color (ej. "despacho azul")
    ROOMS.forEach((room) => {
      const roomNameLower = room.name.toLowerCase();
      if (lower.includes(`despacho ${roomNameLower}`)) {
        rooms.add(room.id);
      }
    });

    // 2. Puertas específicas (1, 2, 3, 4) o pares / impares
    for (let dNum = 1; dNum <= 4; dNum++) {
      const regex = new RegExp(`\\bpuerta\\s+${dNum}\\b`, 'i');
      if (regex.test(lower)) {
        doors.add(dNum);
      }
    }

    if (lower.includes('puerta par') || lower.includes('puertas pares')) {
      doors.add(2);
      doors.add(4);
    }

    if (lower.includes('puerta impar') || lower.includes('puertas impares')) {
      doors.add(1);
      doors.add(3);
    }

    if (doors.size > 0 && level.doors) {
      level.doors.forEach((d) => {
        if (doors.has(d.number)) {
          doorCells.add(`${d.r1},${d.c1}`);
          doorCells.add(`${d.r2},${d.c2}`);
        }
      });
    }

    // 3. Fachadas cardinales y exteriores
    const hasNorth = /\bnorte\b/i.test(lower);
    const hasSouth = /\bsur\b/i.test(lower);
    const hasEast = /\beste\b/i.test(lower);
    const hasWest = /\boeste\b/i.test(lower);
    const hasGenericFacade =
      lower.includes('fachada exterior') || lower.includes('fachadas');
    const hasCorners = lower.includes('esquinas exteriores');

    if (hasNorth) {
      facades.add('north');
      const rows = lower.includes('2 primeras filas') ? [0, 1] : [0];
      rows.forEach((r) => {
        for (let c = 0; c < 5; c++) facadeCells.add(`${r},${c}`);
      });
    }

    if (hasSouth) {
      facades.add('south');
      const rows = lower.includes('2 últimas filas') ? [3, 4] : [4];
      rows.forEach((r) => {
        for (let c = 0; c < 5; c++) facadeCells.add(`${r},${c}`);
      });
    }

    if (hasEast) {
      facades.add('east');
      for (let r = 0; r < 5; r++) facadeCells.add(`${r},4`);
    }

    if (hasWest) {
      facades.add('west');
      for (let r = 0; r < 5; r++) facadeCells.add(`${r},0`);
    }

    if (hasGenericFacade) {
      facades.add('north');
      facades.add('south');
      facades.add('east');
      facades.add('west');
      for (let i = 0; i < 5; i++) {
        facadeCells.add(`0,${i}`);
        facadeCells.add(`4,${i}`);
        facadeCells.add(`${i},0`);
        facadeCells.add(`${i},4`);
      }
    }

    if (hasCorners) {
      facades.add('north');
      facades.add('south');
      facades.add('east');
      facades.add('west');
      facadeCells.add('0,0');
      facadeCells.add('0,4');
      facadeCells.add('4,0');
      facadeCells.add('4,4');
    }

    // 4. Sospechosos mencionados en la pista
    SUSPECTS.forEach((s) => {
      if (s.id !== activeSuspect && lower.includes(s.name.toLowerCase())) {
        suspects.add(s.id);
      }
    });

    if (lower.includes('otra mujer')) {
      SUSPECTS.forEach((s) => {
        if (s.isCarnivore && s.id !== activeSuspect) {
          suspects.add(s.id);
        }
      });
    }

    if (lower.includes('dos mujeres')) {
      SUSPECTS.forEach((s) => {
        if (s.isCarnivore) {
          suspects.add(s.id);
        }
      });
    }

    return { rooms, doors, doorCells, facades, facadeCells, suspects };
  }, [currentClue, level, activeSuspect]);

  if (!level) return null;

  const hasPlacements = Object.keys(placements).length > 0;

  // Paleta Grafito Oscuro (#14161B / #1E2026) vs Modo Claro
  const pageBgClass = isDark
    ? 'bg-[#14161B] text-neutral-100'
    : 'bg-[#F3F4F6] text-neutral-900';
  const cardBgClass = isDark
    ? 'bg-[#1E2026] border-[#2C303A]'
    : 'bg-white border-neutral-200/90';
  const subTextClass = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const primaryActionBtnClass = isDark
    ? 'bg-white hover:bg-neutral-200 text-neutral-950'
    : 'bg-neutral-900 hover:bg-neutral-800 text-white';

  return (
    <div
      className={`h-dvh max-h-dvh overflow-hidden font-sans select-none flex flex-col items-center justify-between px-3 pt-[max(0.35rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors duration-200 ${pageBgClass}`}
    >
      {/* Animación sutil de tembleque para sospechosos mencionados en la pista */}
      <style>{`
        @keyframes suspectWobble {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          20% { transform: rotate(-7deg) translateY(-1px); }
          40% { transform: rotate(7deg) translateY(-1px); }
          60% { transform: rotate(-5deg) translateY(0); }
          80% { transform: rotate(5deg) translateY(0); }
        }
        .animate-wobble {
          animation: suspectWobble 1.15s ease-in-out infinite;
        }
      `}</style>

      <div className="w-full max-w-[400px] h-full flex flex-col justify-between gap-1.5 min-h-0">
        {/* 1. CABECERA CON TÍTULO SANDWICHCASE.IO */}
        <header className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5 shrink-0 py-0.5">
          <button
            type="button"
            onClick={() => setIsModeModalOpen(true)}
            title="Menú y reglas del juego"
            className={`w-9 h-9 rounded-xl border transition cursor-pointer shrink-0 flex items-center justify-center ${
              isDark
                ? 'bg-[#1E2026] border-[#2C303A] hover:border-neutral-600 text-neutral-200'
                : 'bg-white border-neutral-200 hover:border-neutral-400 text-neutral-800 shadow-2xs'
            }`}
          >
            <Menu className="w-4 h-4" />
          </button>

          <h1 className="font-sans text-[clamp(0.82rem,3.8vw,1rem)] font-black tracking-tight leading-tight flex items-center justify-center gap-1.5 min-w-0 text-center px-0.5">
            <img
              src={sandwichSvg}
              alt="Sándwich"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className="truncate">sandwichcase.io</span>
          </h1>

          <div className="flex items-center justify-end gap-1.5 shrink-0">
            {/* Botón del Ranking: Pastilla amarilla y trofeo en silueta */}
            {isDailyMode && gameWon && (
              <button
                type="button"
                onClick={() => {
                  setLeaderboardDay('today');
                  setModalTab('leaderboard');
                  setIsShareModalOpen(true);
                }}
                title="Ver Ranking"
                className="p-1.5 rounded-lg border border-amber-400 bg-amber-400 hover:bg-amber-500 text-white transition cursor-pointer flex items-center justify-center shadow-2xs"
              >
                <Trophy className="w-3.5 h-3.5 text-white" />
              </button>
            )}

            {gameWon && (
              <button
                type="button"
                onClick={() => {
                  setModalTab('share');
                  setIsShareModalOpen(true);
                }}
                title="Compartir resultado"
                className={`p-1.5 rounded-lg font-black text-[10px] flex items-center justify-center transition cursor-pointer ${primaryActionBtnClass}`}
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

            <div
              className={`flex items-center gap-1.5 font-mono font-bold text-xs px-2 py-1 rounded-lg border ${
                isDark
                  ? 'bg-[#1E2026] border-[#2C303A] text-neutral-200'
                  : 'bg-white border-neutral-200 text-neutral-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  gameWon
                    ? isDark
                      ? 'bg-white'
                      : 'bg-neutral-900'
                    : isAnyModalOpen
                    ? 'bg-amber-400'
                    : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span>{formatTime(seconds)}</span>
            </div>
          </div>
        </header>

        {/* 2. TABLERO 5x5 CON FACHADAS E ILUMINACIÓN INTERACTIVA DE PISTAS */}
        <div
          className={`flex-1 min-h-0 w-full border rounded-2xl p-2 shadow-xs flex flex-col justify-between gap-1.5 ${cardBgClass}`}
        >
          <div
            className="flex-1 min-h-0 w-full flex items-center justify-center"
            style={{ containerType: 'size' }}
          >
            <div
              className="relative aspect-square max-w-full max-h-full pt-4 pb-4 px-4"
              style={{
                width: 'min(100cqw, 100cqh)',
                height: 'min(100cqw, 100cqh)'
              }}
            >
              {/* FACHADA NORTE */}
              <div className="absolute top-0 inset-x-0 h-4 flex items-center justify-center pointer-events-none z-20">
                <span
                  className={`relative text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                    activeClueHighlights.facades.has('north')
                      ? 'bg-white text-[#181A20] border border-[#181A20] px-2 py-px rounded-full shadow-md scale-105 ring-2 ring-[#181A20]/20 animate-pulse'
                      : isDark
                      ? 'text-neutral-400'
                      : 'text-neutral-500'
                  }`}
                >
                  {activeClueHighlights.facades.has('north') && (
                    <span className="absolute -inset-0.5 rounded-full border border-white/90 animate-ping pointer-events-none" />
                  )}
                  <span className="relative z-10">FACHADA NORTE</span>
                </span>
              </div>

              {/* FACHADA SUR */}
              <div className="absolute bottom-0 inset-x-0 h-4 flex items-center justify-center pointer-events-none z-20">
                <span
                  className={`relative text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                    activeClueHighlights.facades.has('south')
                      ? 'bg-white text-[#181A20] border border-[#181A20] px-2 py-px rounded-full shadow-md scale-105 ring-2 ring-[#181A20]/20 animate-pulse'
                      : isDark
                      ? 'text-neutral-400'
                      : 'text-neutral-500'
                  }`}
                >
                  {activeClueHighlights.facades.has('south') && (
                    <span className="absolute -inset-0.5 rounded-full border border-white/90 animate-ping pointer-events-none" />
                  )}
                  <span className="relative z-10">FACHADA SUR</span>
                </span>
              </div>

              {/* FACHADA OESTE */}
              <div className="absolute left-0 inset-y-0 w-4 flex items-center justify-center pointer-events-none z-20">
                <span
                  className={`relative text-[9px] font-black uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 transition-all duration-200 ${
                    activeClueHighlights.facades.has('west')
                      ? 'bg-white text-[#181A20] border border-[#181A20] py-2 px-px rounded-full shadow-md scale-105 ring-2 ring-[#181A20]/20 animate-pulse'
                      : isDark
                      ? 'text-neutral-400'
                      : 'text-neutral-500'
                  }`}
                >
                  {activeClueHighlights.facades.has('west') && (
                    <span className="absolute -inset-0.5 rounded-full border border-white/90 animate-ping pointer-events-none" />
                  )}
                  <span className="relative z-10">FACHADA OESTE</span>
                </span>
              </div>

              {/* FACHADA ESTE */}
              <div className="absolute right-0 inset-y-0 w-4 flex items-center justify-center pointer-events-none z-20">
                <span
                  className={`relative text-[9px] font-black uppercase tracking-widest [writing-mode:vertical-lr] transition-all duration-200 ${
                    activeClueHighlights.facades.has('east')
                      ? 'bg-white text-[#181A20] border border-[#181A20] py-2 px-px rounded-full shadow-md scale-105 ring-2 ring-[#181A20]/20 animate-pulse'
                      : isDark
                      ? 'text-neutral-400'
                      : 'text-neutral-500'
                  }`}
                >
                  {activeClueHighlights.facades.has('east') && (
                    <span className="absolute -inset-0.5 rounded-full border border-white/90 animate-ping pointer-events-none" />
                  )}
                  <span className="relative z-10">FACHADA ESTE</span>
                </span>
              </div>

              {/* CUADRÍCULA 5x5 LIMPIA */}
              <div className="relative w-full h-full">
                <div className="w-full h-full grid grid-cols-5 grid-rows-5 border-[3px] border-[#181A20] rounded-xl overflow-hidden bg-[#181A20] shadow-inner">
                  {Array.from({ length: 5 }).map((_, r) =>
                    Array.from({ length: 5 }).map((__, c) => {
                      const key = `${r},${c}`;
                      const roomId = level.grid[r][c];
                      const roomObj = ROOMS[roomId];
                      const isVase = r === level.vasePos.r && c === level.vasePos.c;
                      const placedSuspectId = placements[key];
                      const placedSuspect =
                        placedSuspectId !== undefined ? SUSPECTS[placedSuspectId] : null;
                      const isInvalidated = invalidatedCells.has(key);
                      const hasConflict = validation.conflicts.has(key);

                      const isRoomHighlighted = activeClueHighlights.rooms.has(roomId);
                      const isDoorCellHighlighted = activeClueHighlights.doorCells.has(key);
                      const isFacadeCellHighlighted =
                        activeClueHighlights.facadeCells.has(key);
                      const isPlacedSuspectHighlighted =
                        placedSuspect !== null &&
                        activeClueHighlights.suspects.has(placedSuspect.id);

                      const topWall = r > 0 && level.grid[r - 1][c] !== roomId;
                      const bottomWall = r < 4 && level.grid[r + 1][c] !== roomId;
                      const leftWall = c > 0 && level.grid[r][c - 1] !== roomId;
                      const rightWall = c < 4 && level.grid[r][c + 1] !== roomId;

                      const isRoomOuterTop = r === 0 || topWall;
                      const isRoomOuterBottom = r === 4 || bottomWall;
                      const isRoomOuterLeft = c === 0 || leftWall;
                      const isRoomOuterRight = c === 4 || rightWall;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleCellClick(r, c)}
                          style={{
                            backgroundColor: isRoomHighlighted
                              ? roomObj.bgActive
                              : roomObj.bgHex,
                            borderTop: topWall
                              ? '2.5px solid #181A20'
                              : '1px solid rgba(24, 26, 32, 0.12)',
                            borderBottom: bottomWall
                              ? '2.5px solid #181A20'
                              : '1px solid rgba(24, 26, 32, 0.12)',
                            borderLeft: leftWall
                              ? '2.5px solid #181A20'
                              : '1px solid rgba(24, 26, 32, 0.12)',
                            borderRight: rightWall
                              ? '2.5px solid #181A20'
                              : '1px solid rgba(24, 26, 32, 0.12)'
                          }}
                          className={`relative w-full h-full flex flex-col items-center justify-center p-0 overflow-hidden transition-colors duration-200 focus:outline-none ${
                            gameWon ? 'cursor-default' : 'cursor-pointer'
                          } ${hasConflict ? 'ring-3 ring-inset ring-rose-600 z-10' : ''}`}
                        >
                          {/* Brillo sutil cuando la coartada menciona este despacho */}
                          {isRoomHighlighted && (
                            <div
                              style={{
                                borderTop: isRoomOuterTop
                                  ? `2px solid ${roomObj.borderHex}`
                                  : 'none',
                                borderBottom: isRoomOuterBottom
                                  ? `2px solid ${roomObj.borderHex}`
                                  : 'none',
                                borderLeft: isRoomOuterLeft
                                  ? `2px solid ${roomObj.borderHex}`
                                  : 'none',
                                borderRight: isRoomOuterRight
                                  ? `2px solid ${roomObj.borderHex}`
                                  : 'none',
                                boxShadow: `inset 0 0 12px ${roomObj.borderHex}2E`
                              }}
                              className="absolute inset-0 pointer-events-none animate-pulse bg-white/25"
                            />
                          )}

                          {/* Resaltado de casilla para puertas, fachadas o sospechoso mencionado */}
                          {(isDoorCellHighlighted ||
                            isFacadeCellHighlighted ||
                            isPlacedSuspectHighlighted) && (
                            <div
                              style={{
                                boxShadow:
                                  'inset 0 0 0 2px rgba(24, 26, 32, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.5)'
                              }}
                              className="absolute inset-0 pointer-events-none animate-pulse bg-white/25"
                            />
                          )}

                          {/* Marcador del Crimen compacto */}
                          {isVase && (
                            <div className="relative z-10 flex flex-col items-center justify-center leading-none pointer-events-none">
                              <img
                                src={sandwichSvg}
                                alt="Sándwich robado"
                                className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                              />
                              <span className="text-[6.5px] font-black uppercase tracking-wider bg-[#181A20] text-white px-1 py-px rounded-xs -mt-0.5">
                                CRIMEN
                              </span>
                            </div>
                          )}

                          {/* Sospechoso colocado (con tembleque sutil si es mencionado en la pista) */}
                          {!isVase && placedSuspect && (
                            <div className="relative z-10 flex flex-col items-center justify-center leading-none pointer-events-none">
                              <img
                                src={placedSuspect.emoji}
                                alt={placedSuspect.name}
                                className={`w-6 h-6 sm:w-7 sm:h-7 object-contain ${
                                  isPlacedSuspectHighlighted ? 'animate-wobble' : ''
                                }`}
                              />
                              <span
                                className={`mt-0.5 px-1.5 py-px rounded text-[8.5px] font-black leading-tight ${
                                  hasConflict
                                    ? 'bg-rose-600 text-white'
                                    : placedSuspect.id === activeSuspect ||
                                      isPlacedSuspectHighlighted
                                    ? 'bg-white text-neutral-950 ring-1 ring-[#181A20] shadow-2xs'
                                    : 'bg-[#181A20] text-white'
                                }`}
                              >
                                {placedSuspect.code}
                              </span>
                            </div>
                          )}

                          {/* Crucecita de casilla descartada */}
                          {!isVase && !placedSuspect && isInvalidated && (
                            <span className="relative z-10 text-neutral-500/55 font-black text-base leading-none pointer-events-none">
                              ✕
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* PUERTAS NUMERADAS (1, 2, 3, 4) CON BRILLO INTERACTIVO */}
                {level.doors.map((door) => {
                  const leftPct =
                    door.orientation === 'vertical'
                      ? (door.c1 + 1) * 20
                      : (door.c1 + 0.5) * 20;
                  const topPct =
                    door.orientation === 'horizontal'
                      ? (door.r1 + 1) * 20
                      : (door.r1 + 0.5) * 20;

                  const isDoorHighlighted = activeClueHighlights.doors.has(door.number);

                  return (
                    <div
                      key={door.number}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-black text-[10px] sm:text-[11px] pointer-events-none transition-all duration-200 ${
                        isDoorHighlighted
                          ? 'bg-white text-[#181A20] border-2 border-[#181A20] scale-115 shadow-lg ring-4 ring-[#181A20]/25'
                          : 'bg-[#181A20] text-white border-2 border-white shadow-md'
                      }`}
                    >
                      {isDoorHighlighted && (
                        <span className="absolute -inset-1 rounded-full border-2 border-white/90 animate-ping pointer-events-none" />
                      )}
                      <span className="relative z-10">{door.number}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BANNER INFERIOR AL COMPLETAR EL NIVEL */}
          {gameWon && (
            <div
              className={`pt-1.5 border-t flex items-center justify-between gap-2 px-1 shrink-0 ${
                isDark ? 'border-[#2C303A]' : 'border-neutral-200'
              }`}
            >
              {isDailyMode ? (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Clock className={`w-3.5 h-3.5 ${subTextClass}`} />
                  <span className={subTextClass}>Próximo en</span>
                  <span className="font-mono font-black tracking-wider">
                    {countdown}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className={`font-bold ${subTextClass}`}>
                    ¡Caso #{level.caseNumber} resuelto!
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleNewRandomLevel}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition cursor-pointer ${primaryActionBtnClass}`}
              >
                <Shuffle className="w-3 h-3" />
                <span>Otro robo</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. BARRA DE REGLA CORTA Y ADAPTADA + BOTÓN LIMPIAR MESA REDUCIDO */}
        <div className="flex items-center justify-between gap-2 px-0.5 shrink-0">
          <div className="flex items-center min-w-0">
            {hasClueMismatch ? (
              <span className="text-[clamp(0.85rem,3.7vw,0.98rem)] font-black leading-tight text-rose-500 truncate">
                ¡Alguna coartada no cuadra!
              </span>
            ) : gameWon ? (
              <span
                className={`text-[clamp(0.85rem,3.7vw,0.98rem)] font-black leading-tight truncate ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              >
                Caso resuelto
              </span>
            ) : (
              <span
                className={`text-[clamp(0.85rem,3.7vw,0.98rem)] font-bold leading-tight truncate ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                El del despacho{' '}
                <strong
                  className={`font-black ${
                    isDark ? 'text-white' : 'text-neutral-950'
                  }`}
                >
                  CRIMEN
                </strong>{' '}
                miente
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearBoard}
            disabled={gameWon || !hasPlacements}
            title="Limpiar mesa"
            className={`h-7 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 text-[11px] font-bold transition shrink-0 ${
              gameWon || !hasPlacements
                ? isDark
                  ? 'bg-[#1E2026]/50 border-[#2C303A] text-neutral-600 cursor-not-allowed'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
                : isDark
                ? 'bg-[#1E2026] border-[#2C303A] text-neutral-200 hover:border-neutral-500 hover:text-white cursor-pointer active:scale-95'
                : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100 shadow-2xs cursor-pointer active:scale-95'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar mesa</span>
          </button>
        </div>

        {/* 4. PÍLDORAS SELECTORAS DE SOSPECHOSOS (UN ÚNICO CÍRCULO POR PÍLDORA) */}
        <div className="w-full grid grid-cols-5 gap-1.5 h-12 shrink-0">
          {SUSPECTS.map((s) => {
            const isSelected = activeSuspect === s.id;
            const isPlaced = suspectPositions[s.id] !== undefined;
            const evalRes = validation.clueResults ? validation.clueResults[s.id] : null;
            const isInconsistent = Boolean(evalRes && !evalRes.isConsistent);

            // Si la pista habla de este sospechoso y NO está colocado, tiembla su icono
            const isPillMentionedAndUnplaced =
              !isPlaced && activeClueHighlights.suspects.has(s.id);

            const baseBgAndText = isSelected
              ? isDark
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'bg-neutral-900 text-white shadow-sm'
              : isPlaced
              ? isDark
                ? 'bg-[#282B34] text-white'
                : 'bg-neutral-200/80 text-neutral-900'
              : isDark
              ? 'bg-[#1E2026] text-neutral-400 hover:bg-[#262932]'
              : 'bg-white text-neutral-700 hover:bg-neutral-50';

            const borderClass = isInconsistent
              ? 'border-2 border-rose-500 ring-1 ring-rose-500/40'
              : isPillMentionedAndUnplaced
              ? isDark
                ? 'border border-neutral-400'
                : 'border border-neutral-500'
              : isSelected
              ? isDark
                ? 'border border-white'
                : 'border border-neutral-900'
              : isPlaced
              ? isDark
                ? 'border border-neutral-600'
                : 'border border-neutral-400'
              : isDark
              ? 'border border-[#2C303A]'
              : 'border border-neutral-200';

            // Único círculo superior derecho:
            // - Color: Gris si no hay nadie marcado como mentiroso; Rojo/Verde si hay alguien marcado.
            // - Relleno: Hueco (solo borde) si NO está colocado en el mapa; Relleno sólido si SÍ está colocado.
            const hasLiarHypothesis = suspectedLiar !== null;
            const isMarkedAsLiar = suspectedLiar === s.id;

            let circleStyle = '';
            if (hasLiarHypothesis) {
              if (isMarkedAsLiar) {
                circleStyle = isPlaced
                  ? 'border-rose-500 bg-rose-500'
                  : 'border-rose-500 bg-transparent';
              } else {
                circleStyle = isPlaced
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-emerald-500 bg-transparent';
              }
            } else {
              circleStyle = isPlaced
                ? 'border-neutral-400 bg-neutral-400'
                : isDark
                ? 'border-neutral-600 bg-transparent'
                : 'border-neutral-300 bg-transparent';
            }

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSuspect(s.id)}
                className={`relative h-full rounded-xl font-black transition-all flex flex-col items-center justify-center cursor-pointer ${baseBgAndText} ${borderClass}`}
              >
                {/* Único círculo indicador (relleno = colocado, color = hipótesis de mentiroso) */}
                <span
                  title={
                    isPlaced ? 'Colocado en la mesa' : 'Sin colocar en la mesa'
                  }
                  className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-[1.5px] transition-colors duration-150 ${circleStyle}`}
                />

                <div className="flex items-center gap-1 leading-none">
                  <span className="text-sm font-black">{s.code}</span>
                  <img
                    src={s.emoji}
                    alt={s.name}
                    className={`w-5 h-5 object-contain ${
                      isPillMentionedAndUnplaced ? 'animate-wobble' : ''
                    }`}
                  />
                </div>
                <span
                  className={`text-[9px] font-bold mt-0.5 truncate max-w-full px-1 ${
                    isSelected
                      ? isDark
                        ? 'text-neutral-800'
                        : 'text-neutral-200'
                      : isDark
                      ? 'text-neutral-400'
                      : 'text-neutral-500'
                  }`}
                >
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* 5. TARJETA DE DECLARACIÓN CON CHECK "MENTIROSO" SIN PÍLDORA */}
        <div
          className={`w-full h-24 border rounded-2xl p-3 flex flex-col justify-between gap-1 shadow-xs shrink-0 overflow-hidden ${cardBgClass}`}
        >
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-6 h-6 rounded-lg border flex items-center justify-center overflow-hidden shrink-0 ${
                  isDark
                    ? 'bg-[#14161B] border-[#2C303A]'
                    : 'bg-neutral-100 border-neutral-200'
                }`}
              >
                <img
                  src={currentSuspect.emoji}
                  alt={currentSuspect.name}
                  className="w-5 h-5 object-contain"
                />
              </span>
              <span
                className={`font-black text-xs truncate ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {currentSuspect.name}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  isDark
                    ? 'bg-[#14161B] text-neutral-300 border-[#2C303A]'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                }`}
              >
                {currentSuspect.isCarnivore ? 'Mujer' : 'Hombre'}
              </span>
            </div>

            {/* Check limpio de "Mentiroso" sin píldora */}
            <button
              type="button"
              onClick={() =>
                setSuspectedLiar((prev) =>
                  prev === activeSuspect ? null : activeSuspect
                )
              }
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                suspectedLiar === activeSuspect
                  ? isDark
                    ? 'text-rose-400'
                    : 'text-rose-600'
                  : `${subTextClass} hover:opacity-80`
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center transition ${
                  suspectedLiar === activeSuspect
                    ? 'bg-rose-500 border-rose-500 text-white'
                    : isDark
                    ? 'border-neutral-500 bg-transparent'
                    : 'border-neutral-400 bg-transparent'
                }`}
              >
                {suspectedLiar === activeSuspect && (
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                )}
              </span>
              <span>Mentiroso</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center px-1">
            <p
              className={`w-full text-center font-sans text-[clamp(0.85rem,3.7vw,0.98rem)] font-normal leading-snug line-clamp-2 ${
                isDark ? 'text-neutral-200' : 'text-neutral-700'
              }`}
            >
              {renderFormattedClue(currentClue?.text, isDark)}
            </p>
          </div>
        </div>
      </div>

      {/* 6. POPUP MODAL DE NORMAS / CÓMO SE JUEGA */}
      {isHelpModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsHelpModalOpen(false)}
        >
          <div className="fixed -inset-20 bg-black/75 backdrop-blur-xs pointer-events-none" />

          <div
            className={`relative z-10 w-full max-w-sm rounded-3xl border p-6 shadow-2xl flex flex-col gap-4 ${
              isDark
                ? 'bg-[#1E2026] border-[#2C303A] text-neutral-100'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-black text-base ${
                    isDark
                      ? 'bg-[#14161B] border-[#2C303A] text-white'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-900'
                  }`}
                >
                  ?
                </div>
                <div>
                  <h2 className="text-base font-black leading-tight">
                    Protocolo Anti-Robos
                  </h2>
                  <p className={`text-xs mt-0.5 ${subTextClass}`}>
                    Alguien ha asaltado tu tupper en la oficina
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'bg-[#14161B] border-[#2C303A] text-neutral-400 hover:text-white'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs leading-relaxed">
              <div
                className={`p-3 rounded-2xl border ${
                  isDark
                    ? 'bg-[#14161B] border-[#2C303A] text-neutral-300'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                <span className="font-black block mb-0.5 text-current">
                  1. Distancia social de oficina
                </span>
                Coloca a los 5 sospechosos en el plano: solo cabe{' '}
                <strong>uno por fila, uno por columna y uno por despacho de color</strong>.
                Además, no se aguantan: no pueden tocarse ni en diagonal.
              </div>

              <div
                className={`p-3 rounded-2xl border ${
                  isDark
                    ? 'bg-[#14161B] border-[#2C303A] text-neutral-300'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                <span className="font-black block mb-0.5 text-current">
                  2. El del despacho del CRIMEN miente
                </span>
                Los 4 inocentes dicen siempre la verdad. Quien esté dentro del{' '}
                <strong>mismo despacho de color que el sándwich (CRIMEN)</strong> es el
                ladrón y su coartada es <strong>falsa</strong>.
              </div>

              <div
                className={`p-3 rounded-2xl border ${
                  isDark
                    ? 'bg-[#14161B] border-[#2C303A] text-neutral-300'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                <span className="font-black block mb-0.5 text-current">
                  3. Cotilleo en las puertas
                </span>
                Estar junto a una puerta significa ocupar cualquiera de las{' '}
                <strong>dos casillas</strong> que conecta ese círculo numerado.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpModalOpen(false)}
              className={`w-full py-2.5 px-4 rounded-xl font-black text-xs transition cursor-pointer ${primaryActionBtnClass}`}
            >
              ¡A interrogar!
            </button>
          </div>
        </div>
      )}

      {/* 7. POPUP MODAL DE HAMBURGUESA (MODO DE JUEGO + REGLAS) */}
      {isModeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsModeModalOpen(false)}
        >
          <div className="fixed -inset-20 bg-black/75 backdrop-blur-xs pointer-events-none" />

          <div
            className={`relative z-10 w-full max-w-sm rounded-3xl border p-6 shadow-2xl flex flex-col gap-4 ${
              isDark
                ? 'bg-[#1E2026] border-[#2C303A] text-neutral-100'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center p-1.5 ${
                    isDark
                      ? 'bg-[#14161B] border-[#2C303A]'
                      : 'bg-neutral-100 border-neutral-200'
                  }`}
                >
                  <img
                    src={sandwichSvg}
                    alt="Sándwich"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-base font-black leading-tight">
                    Archivos de RR.HH.
                  </h2>
                  <p className={`text-xs mt-0.5 ${subTextClass}`}>
                    ¿Qué robo de almuerzo investigamos ahora?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModeModalOpen(false)}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'bg-[#14161B] border-[#2C303A] text-neutral-400 hover:text-white'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleLoadDaily}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                  isDailyMode
                    ? isDark
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-white border-neutral-900'
                    : isDark
                    ? 'bg-[#14161B] hover:bg-neutral-800/80 text-neutral-200 border-[#2C303A]'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">El Robo del Día</div>
                    <div
                      className={`text-[11px] ${
                        isDailyMode
                          ? isDark
                            ? 'text-neutral-700'
                            : 'text-neutral-300'
                          : subTextClass
                      }`}
                    >
                      El mismo misterio para toda la oficina ({dailyConfig.formattedDate})
                    </div>
                  </div>
                </div>
                {isDailyMode && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                    Activo
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleNewRandomLevel}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                  !isDailyMode
                    ? isDark
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-white border-neutral-900'
                    : isDark
                    ? 'bg-[#14161B] hover:bg-neutral-800/80 text-neutral-200 border-[#2C303A]'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shuffle className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">Horas Extra (Aleatorio)</div>
                    <div
                      className={`text-[11px] ${
                        !isDailyMode
                          ? isDark
                            ? 'text-neutral-700'
                            : 'text-neutral-300'
                          : subTextClass
                      }`}
                    >
                      Generar un nuevo drama de oficina al instante
                    </div>
                  </div>
                </div>
                {!isDailyMode && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                    Activo
                  </span>
                )}
              </button>

              {/* Botón de Reglas / Cómo se juega trasladado al menú hamburguesa */}
              <button
                type="button"
                onClick={() => {
                  setIsModeModalOpen(false);
                  setIsHelpModalOpen(true);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                  isDark
                    ? 'bg-[#14161B] hover:bg-neutral-800/80 text-neutral-200 border-[#2C303A]'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">Reglas / Cómo se juega</div>
                    <div className={`text-[11px] ${subTextClass}`}>
                      Repasa el protocolo anti-robos de la oficina
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. POPUP MODAL DE COMPARTIR Y RANKING DIARIO */}
      {isShareModalOpen && gameWon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div className="fixed -inset-20 bg-black/75 backdrop-blur-xs pointer-events-none" />

          <div
            className={`relative z-10 w-full max-w-sm max-h-[88dvh] rounded-3xl border p-5 shadow-2xl flex flex-col gap-3.5 overflow-hidden ${
              isDark
                ? 'bg-[#1E2026] border-[#2C303A] text-neutral-100'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center p-1.5 shrink-0 ${
                    isDark
                      ? 'bg-[#14161B] border-[#2C303A]'
                      : 'bg-neutral-100 border-neutral-200'
                  }`}
                >
                  <img
                    src={SUSPECTS[level.thiefId].emoji}
                    alt={SUSPECTS[level.thiefId].name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-base font-black leading-tight">
                    ¡Pillas a {SUSPECTS[level.thiefId].name} masticando!
                  </h2>
                  <p className={`font-sans text-xs mt-0.5 italic ${subTextClass}`}>
                    {cleanStatementText(SUSPECTS[level.thiefId].confession)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-[#14161B] border-[#2C303A] text-neutral-400 hover:text-white'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Pestañas (Solo en Modo Diario una vez resuelto) */}
            {isDailyMode && (
              <div
                className={`grid grid-cols-2 p-1 rounded-xl border shrink-0 ${
                  isDark
                    ? 'bg-[#14161B] border-[#2C303A]'
                    : 'bg-neutral-100 border-neutral-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setModalTab('share')}
                  className={`py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    modalTab === 'share'
                      ? isDark
                        ? 'bg-[#282B34] text-white shadow-2xs'
                        : 'bg-white text-neutral-900 shadow-2xs'
                      : subTextClass
                  }`}
                >
                  Informe RR.HH.
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('leaderboard')}
                  className={`py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    modalTab === 'leaderboard'
                      ? isDark
                        ? 'bg-[#282B34] text-white shadow-2xs'
                        : 'bg-white text-neutral-900 shadow-2xs'
                      : subTextClass
                  }`}
                >
                  <span className="w-4 h-4 rounded bg-amber-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-2.5 h-2.5 text-white" />
                  </span>
                  <span>Ranking</span>
                </button>
              </div>
            )}

            {/* PESTAÑA 1: COMPARTIR INFORME */}
            {(!isDailyMode || modalTab === 'share') && (
              <>
                {isDailyMode && (
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl border flex items-center justify-between text-xs ${
                      isDark
                        ? 'bg-[#14161B] border-[#2C303A]'
                        : 'bg-neutral-100 border-neutral-200'
                    }`}
                  >
                    <span className={`font-bold ${subTextClass}`}>
                      Próximo robo diario:
                    </span>
                    <span className="font-mono font-black text-sm tracking-wider">
                      {countdown}
                    </span>
                  </div>
                )}

                <div
                  className={`rounded-2xl p-3.5 border text-xs font-mono whitespace-pre-line leading-relaxed ${
                    isDark
                      ? 'bg-[#14161B] border-[#2C303A] text-neutral-300'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <img
                      src={sandwichSvg}
                      alt="Sándwich"
                      className="w-4 h-4 object-contain shrink-0"
                    />
                    <span className="font-bold">Informe oficial</span>
                  </div>
                  {shareText}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleNativeOrWhatsAppShare}
                    className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${primaryActionBtnClass}`}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Presumir en el grupo</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyShareText}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        isDark
                          ? 'bg-[#282B34] hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                      }`}
                    >
                      {copiedShare ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar informe</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleNewRandomLevel}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        isDark
                          ? 'bg-[#282B34] hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Otro robo</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* PESTAÑA 2: RANKING (CON FILA DEL JUGADOR RESALTADA) */}
            {isDailyMode && modalTab === 'leaderboard' && (
              <div className="flex flex-col gap-2.5 min-h-0 flex-1 overflow-hidden">
                {/* Barra superior para alternar entre el Ranking de Hoy y el de Ayer */}
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <span className={`text-[11px] font-bold ${subTextClass}`}>
                    {leaderboardDay === 'today'
                      ? `Hoy · ${dailyConfig.formattedDate}`
                      : `Ayer · ${yesterdayConfig.formattedDate}`}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setLeaderboardDay((prev) =>
                        prev === 'today' ? 'yesterday' : 'today'
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isDark
                        ? 'bg-[#14161B] border-[#2C303A] hover:border-neutral-600 text-neutral-200'
                        : 'bg-neutral-100 border-neutral-200 hover:bg-neutral-200 text-neutral-800'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {leaderboardDay === 'today'
                        ? 'Ver ranking de ayer'
                        : 'Volver al ranking de hoy'}
                    </span>
                  </button>
                </div>

                {/* Formulario (solo visible en el ranking de HOY si aún no se ha enviado) */}
                {leaderboardDay === 'today' && !scoreSubmitted && (
                  <form
                    onSubmit={handleSubmitScore}
                    className={`p-3 rounded-2xl border flex flex-col gap-2 shrink-0 ${
                      isDark
                        ? 'bg-[#14161B] border-[#2C303A]'
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black">
                        Registra tu tiempo en el ranking
                      </span>
                      <span className="font-mono font-bold text-emerald-500">
                        {formatTime(seconds)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="text"
                        required
                        maxLength={18}
                        placeholder="Tu apodo"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none ${
                          isDark
                            ? 'bg-[#1E2026] border-[#2C303A] text-white placeholder:text-neutral-500'
                            : 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingScore}
                        className={`px-3 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${primaryActionBtnClass}`}
                      >
                        <Send className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isSubmittingScore ? '...' : 'Guardar'}
                        </span>
                      </button>
                    </div>

                    {submitError && (
                      <span className="text-[10px] text-rose-500 font-bold">
                        {submitError}
                      </span>
                    )}
                  </form>
                )}

                {/* Lista con scroll de los mejores detectives */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-1.5">
                  {!supabase ? (
                    <div className={`py-6 text-center text-xs ${subTextClass}`}>
                      Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.
                    </div>
                  ) : isLoadingBoard ? (
                    <div className={`py-8 text-center text-xs ${subTextClass}`}>
                      Cargando ranking...
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className={`py-8 text-center text-xs ${subTextClass}`}>
                      {leaderboardDay === 'today'
                        ? 'Nadie se ha apuntado hoy todavía. ¡Sé el primero!'
                        : 'Ayer no quedaron tiempos registrados en el ranking.'}
                    </div>
                  ) : (
                    leaderboard.map((entry, idx) => {
                      const isCurrentUser = entry.id === highlightedEntryId;

                      return (
                        <div
                          key={entry.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                            isCurrentUser
                              ? isDark
                                ? 'bg-amber-400/15 border-amber-400/80 ring-1 ring-amber-400/30'
                                : 'bg-amber-50 border-amber-400 ring-1 ring-amber-300/50'
                              : isDark
                              ? 'bg-[#14161B] border-[#2C303A]'
                              : 'bg-neutral-50 border-neutral-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-400 text-neutral-950'
                                  : idx === 1
                                  ? 'bg-neutral-300 text-neutral-950'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : isDark
                                  ? 'bg-[#282B34] text-neutral-400'
                                  : 'bg-neutral-200 text-neutral-600'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span
                              className={`font-black text-xs truncate ${
                                isCurrentUser
                                  ? isDark
                                    ? 'text-amber-300'
                                    : 'text-amber-900'
                                  : ''
                              }`}
                            >
                              {entry.player_name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-neutral-950 shrink-0 leading-none">
                                TÚ
                              </span>
                            )}
                          </div>
                          <span
                            className={`font-mono font-black text-xs shrink-0 ${
                              isCurrentUser
                                ? isDark
                                  ? 'text-amber-300'
                                  : 'text-amber-900'
                                : ''
                            }`}
                          >
                            {formatTime(entry.seconds)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Analytics />
    </div>
  );
}
