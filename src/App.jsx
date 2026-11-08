import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Share2,
  Check,
  X,
  Copy,
  Shuffle,
  Calendar
} from 'lucide-react';

import auditorSvg from './assets/auditor.svg';
import becarioSvg from './assets/becario.svg';
import consultorSvg from './assets/consultor.svg';
import directorSvg from './assets/director.svg';
import empleadoSvg from './assets/empleado.svg';
import sandwichSvg from './assets/sandwich.svg';
import { Analytics } from '@vercel/analytics/react';

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
    bgHex: '#DBEAFE',
    bgActive: '#BFDBFE',
    borderHex: '#2563EB'
  },
  {
    id: 1,
    name: 'Roja',
    bgHex: '#FEE2E2',
    bgActive: '#FECACA',
    borderHex: '#DC2626'
  },
  {
    id: 2,
    name: 'Verde',
    bgHex: '#D1FAE5',
    bgActive: '#A7F3D0',
    borderHex: '#059669'
  },
  {
    id: 3,
    name: 'Amarillo',
    bgHex: '#FEF9C3',
    bgActive: '#FEF08A',
    borderHex: '#CA8A04'
  },
  {
    id: 4,
    name: 'Morado',
    bgHex: '#EDE9FE',
    bgActive: '#DDD6FE',
    borderHex: '#7C3AED'
  }
];

const SUSPECTS = [
  { id: 0, code: 'A', name: 'Analista', emoji: auditorSvg, diet: 'Hombre', isCarnivore: false },
  { id: 1, code: 'B', name: 'Becaria', emoji: becarioSvg, diet: 'Mujer', isCarnivore: true },
  { id: 2, code: 'C', name: 'Contable', emoji: consultorSvg, diet: 'Mujer', isCarnivore: true },
  { id: 3, code: 'D', name: 'Director', emoji: directorSvg, diet: 'Hombre', isCarnivore: false },
  { id: 4, code: 'E', name: 'Experto', emoji: empleadoSvg, diet: 'Hombre', isCarnivore: false }
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
  [['Umbral', 'Fachada', 'Escenario'],     ['Claustrofobia', 'Paranoia', 'Despacho']],
  [['Umbral', 'Fachada', 'Paranoia'],      ['Claustrofobia', 'Escenario', 'Despacho']],
  [['Umbral', 'Fachada', 'Despacho'],      ['Claustrofobia', 'Escenario', 'Paranoia']],
  [['Umbral', 'Claustrofobia', 'Escenario'],['Fachada', 'Paranoia', 'Despacho']],
  [['Umbral', 'Claustrofobia', 'Paranoia'],['Fachada', 'Escenario', 'Despacho']],
  [['Umbral', 'Claustrofobia', 'Despacho'],['Fachada', 'Escenario', 'Paranoia']],
  [['Umbral', 'Escenario', 'Paranoia'],    ['Fachada', 'Claustrofobia', 'Despacho']],
  [['Umbral', 'Escenario', 'Despacho'],    ['Fachada', 'Claustrofobia', 'Paranoia']],
  [['Umbral', 'Paranoia', 'Despacho'],     ['Fachada', 'Claustrofobia', 'Escenario']]
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

  // 1. Umbral / Puertas
  for (let dNum = 1; dNum <= 4; dNum++) {
    clues.push({
      id: `self_door_${dNum}`,
      category: 'Umbral',
      weight: 15,
      text: `Yo estaba apostado junto a la puerta ${dNum}.`,
      evalFn: (st) => st.doorOccupant[dNum] === speakerId
    });

    clues.push({
      id: `nobody_door_${dNum}`,
      category: 'Umbral',
      weight: 11,
      text: `Nadie vigilaba junto a la puerta ${dNum}.`,
      evalFn: (st) => st.doorOccupant[dNum] === -1
    });

    clues.push({
      id: `someone_door_${dNum}`,
      category: 'Umbral',
      weight: 11,
      text: `Vi a alguien apostado junto a la puerta ${dNum}.`,
      evalFn: (st) => st.doorOccupant[dNum] !== -1
    });

    clues.push({
      id: `carnivore_door_${dNum}`,
      category: 'Umbral',
      weight: 14,
      text: `Una mujer merodeaba junto a la puerta ${dNum}.`,
      evalFn: (st) => {
        const occ = st.doorOccupant[dNum];
        return occ !== -1 && SUSPECTS[occ].isCarnivore;
      }
    });

    clues.push({
      id: `herbivore_door_${dNum}`,
      category: 'Umbral',
      weight: 13,
      text: `Un hombre estaba junto a la puerta ${dNum}.`,
      evalFn: (st) => {
        const occ = st.doorOccupant[dNum];
        return occ !== -1 && !SUSPECTS[occ].isCarnivore;
      }
    });

    for (let otherId = 0; otherId < 5; otherId++) {
      if (otherId === speakerId) continue;
      clues.push({
        id: `other_${otherId}_door_${dNum}`,
        category: 'Umbral',
        weight: 15,
        text: `${SUSPECTS[otherId].name} estaba junto a la puerta ${dNum}.`,
        evalFn: (st) => st.doorOccupant[dNum] === otherId
      });
    }
  }

  clues.push({
    id: `self_even_door`,
    category: 'Umbral',
    weight: 14,
    text: `Yo estaba junto a una puerta par (2 o 4).`,
    evalFn: (st) => st.doorOccupant[2] === speakerId || st.doorOccupant[4] === speakerId
  });

  clues.push({
    id: `self_odd_door`,
    category: 'Umbral',
    weight: 14,
    text: `Yo estaba junto a una puerta impar (1 o 3).`,
    evalFn: (st) => st.doorOccupant[1] === speakerId || st.doorOccupant[3] === speakerId
  });

  clues.push({
    id: `room_dead_end`,
    category: 'Umbral',
    weight: 15,
    text: `Mi despacho solo tiene una puerta numerada.`,
    evalFn: (st) => roomDoors[st.suspectRoom[speakerId]].length === 1
  });

  clues.push({
    id: `room_multi_doors`,
    category: 'Umbral',
    weight: 13,
    text: `Mi despacho cuenta con al menos 2 puertas numeradas en sus muros.`,
    evalFn: (st) => roomDoors[st.suspectRoom[speakerId]].length >= 2
  });

  clues.push({
    id: `room_no_even_doors`,
    category: 'Umbral',
    weight: 14,
    text: `Mi despacho no tiene ninguna puerta par en sus muros.`,
    evalFn: (st) => {
      const dList = roomDoors[st.suspectRoom[speakerId]];
      return !dList.includes(2) && !dList.includes(4);
    }
  });

  clues.push({
    id: `room_no_odd_doors`,
    category: 'Umbral',
    weight: 14,
    text: `Mi despacho no tiene ninguna puerta impar en sus muros.`,
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
        text: `El despacho de ${SUSPECTS[otherId].name} y el mío están conectados por la puerta ${dNum}.`,
        evalFn: (st) => {
          const rm1 = st.suspectRoom[speakerId];
          const rm2 = st.suspectRoom[otherId];
          return (rm1 === rA && rm2 === rB) || (rm1 === rB && rm2 === rA);
        }
      });
    }
  }

  if (speaker.isCarnivore) {
    const otherCarnivoreId = speakerId === 1 ? 2 : 1;
    clues.push({
      id: `other_carnivore_even_door`,
      category: 'Umbral',
      weight: 16,
      text: `El despacho de la otra mujer y el mío están comunicados por una puerta par.`,
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
      text: `El despacho de la otra mujer y el mío están comunicados por una puerta impar.`,
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

  // 2. Fachada / Cardinal
  clues.push({
    id: `facade_north`,
    category: 'Fachada',
    weight: 16,
    text: `Me situé tocando la fachada Norte de la oficina.`,
    evalFn: (st) => st.suspectRow[speakerId] === 0
  });

  clues.push({
    id: `facade_south`,
    category: 'Fachada',
    weight: 16,
    text: `Me situé tocando la fachada Sur de la oficina.`,
    evalFn: (st) => st.suspectRow[speakerId] === 4
  });

  clues.push({
    id: `facade_west`,
    category: 'Fachada',
    weight: 16,
    text: `Estaba tocando fachada Oeste de la oficina.`,
    evalFn: (st) => st.suspectCol[speakerId] === 0
  });

  clues.push({
    id: `facade_east`,
    category: 'Fachada',
    weight: 16,
    text: `Estaba tocando la fachada Este de la oficina.`,
    evalFn: (st) => st.suspectCol[speakerId] === 4
  });

  clues.push({
    id: `facade_corner`,
    category: 'Fachada',
    weight: 17,
    text: `Me oculté en una de las 4 esquinas exteriores de la oficina.`,
    evalFn: (st) =>
      (st.suspectRow[speakerId] === 0 || st.suspectRow[speakerId] === 4) &&
      (st.suspectCol[speakerId] === 0 || st.suspectCol[speakerId] === 4)
  });

  clues.push({
    id: `facade_interior`,
    category: 'Fachada',
    weight: 15,
    text: `Me mantuve en el interior de la oficina, sin tocar ninguna fachada exterior.`,
    evalFn: (st) =>
      st.suspectRow[speakerId] > 0 &&
      st.suspectRow[speakerId] < 4 &&
      st.suspectCol[speakerId] > 0 &&
      st.suspectCol[speakerId] < 4
  });

  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;
    clues.push({
      id: `more_north_than_${otherId}`,
      category: 'Fachada',
      weight: 14,
      text: `Yo estaba más al Norte que ${SUSPECTS[otherId].name}.`,
      evalFn: (st) => st.suspectRow[speakerId] < st.suspectRow[otherId]
    });

    clues.push({
      id: `more_west_than_${otherId}`,
      category: 'Fachada',
      weight: 14,
      text: `Yo estaba más al Oeste que ${SUSPECTS[otherId].name}.`,
      evalFn: (st) => st.suspectCol[speakerId] < st.suspectCol[otherId]
    });
  }

  // 3. Claustrofobia / Tamaño
  if (largestRooms.length === 1) {
    clues.push({
      id: `self_largest_room`,
      category: 'Claustrofobia',
      weight: 16,
      text: `Me escondí en el despacho más grande de toda la oficina (${maxSize} casillas).`,
      evalFn: (st) => st.suspectRoom[speakerId] === largestRooms[0]
    });
  }

  if (smallestRooms.length === 1) {
    clues.push({
      id: `self_smallest_room`,
      category: 'Claustrofobia',
      weight: 16,
      text: `Me escondí en el despacho más pequeño de la oficina (${minSize} casillas).`,
      evalFn: (st) => st.suspectRoom[speakerId] === smallestRooms[0]
    });
  }

  const uniqueSizes = Array.from(new Set(roomSizes));
  for (const sz of uniqueSizes) {
    clues.push({
      id: `self_room_size_${sz}`,
      category: 'Claustrofobia',
      weight: 15,
      text: `Mi despacho tiene una superficie exacta de ${sz} casillas.`,
      evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] === sz
    });
  }

  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;
    clues.push({
      id: `bigger_room_than_${otherId}`,
      category: 'Claustrofobia',
      weight: 14,
      text: `Mi despacho tiene más casillas que el despacho de ${SUSPECTS[otherId].name}.`,
      evalFn: (st) =>
        roomSizes[st.suspectRoom[speakerId]] > roomSizes[st.suspectRoom[otherId]]
    });
  }

  // 4. Contacto con Escenario (sandwich 🥪)
  clues.push({
    id: `adj_to_vase_orth`,
    category: 'Escenario',
    weight: 18,
    text: `Mi casilla estaba pegada ortogonalmente a el sandwich mordido (🥪), aunque hubiera muro en medio.`,
    evalFn: (st) =>
      Math.abs(st.suspectRow[speakerId] - vasePos.r) +
        Math.abs(st.suspectCol[speakerId] - vasePos.c) ===
      1
  });

  clues.push({
    id: `adj_to_vase_king`,
    category: 'Escenario',
    weight: 17,
    text: `Estaba a solo una casilla de distancia (incluso en diagonal) de el sandwich mordido (🥪).`,
    evalFn: (st) =>
      Math.abs(st.suspectRow[speakerId] - vasePos.r) <= 1 &&
      Math.abs(st.suspectCol[speakerId] - vasePos.c) <= 1
  });

  for (let rm = 0; rm < 5; rm++) {
    const rmName = ROOMS[rm].name.toLowerCase();
    clues.push({
      id: `touch_wall_of_room_${rm}`,
      category: 'Escenario',
      weight: 16,
      text: `Desde mi casilla tocaba por fuera el muro divisorio de la sala ${rmName}.`,
      evalFn: (st) => {
        const r = st.suspectRow[speakerId];
        const c = st.suspectCol[speakerId];
        return cellTouchesRoomWall[r][c].has(rm);
      }
    });
  }

  // 5. Paranoia Cruzada
  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;
    clues.push({
      id: `accuse_${otherId}`,
      category: 'Paranoia',
      weight: 15,
      text: `${SUSPECTS[otherId].name} está mintiendo en su declaración.`,
      evalFn: (st) => st.suspectRoom[otherId] === vaseRoom
    });

    clues.push({
      id: `vouch_${otherId}`,
      category: 'Paranoia',
      weight: 13,
      text: `Puedo asegurar que ${SUSPECTS[otherId].name} es inocente y dice la verdad.`,
      evalFn: (st) => st.suspectRoom[otherId] !== vaseRoom
    });
  }

  clues.push({
    id: `thief_is_carnivore`,
    category: 'Paranoia',
    weight: 16,
    text: `El ladrón es una mujer.`,
    evalFn: (st) => SUSPECTS[st.roomSuspect[vaseRoom]].isCarnivore
  });

  clues.push({
    id: `thief_is_herbivore`,
    category: 'Paranoia',
    weight: 15,
    text: `El ladrón es un hombre.`,
    evalFn: (st) => !SUSPECTS[st.roomSuspect[vaseRoom]].isCarnivore
  });

  clues.push({
    id: `thief_on_north_half`,
    category: 'Paranoia',
    weight: 16,
    text: `El ladrón se ocultó en las dos primeras filas del Norte.`,
    evalFn: (st) => st.suspectRow[st.roomSuspect[vaseRoom]] <= 1
  });

  clues.push({
    id: `thief_at_some_door`,
    category: 'Paranoia',
    weight: 16,
    text: `El ladrón estaba apostado junto a una de las 4 puertas numeradas.`,
    evalFn: (st) => {
      const thiefInS = st.roomSuspect[vaseRoom];
      return st.suspectDoors[thiefInS].length > 0;
    }
  });

  // 6. Despacho / Dieta
  for (let rm = 0; rm < 5; rm++) {
    const rmName = ROOMS[rm].name.toLowerCase();

    clues.push({
      id: `self_in_room_${rm}`,
      category: 'Despacho',
      weight: 9,
      text: `Yo estaba en el despacho ${rmName}.`,
      evalFn: (st) => st.suspectRoom[speakerId] === rm
    });

    clues.push({
      id: `carnivore_in_room_${rm}`,
      category: 'Despacho',
      weight: 11,
      text: `Una mujer ocupaba el despacho ${rmName}.`,
      evalFn: (st) => SUSPECTS[st.roomSuspect[rm]].isCarnivore
    });

    clues.push({
      id: `herbivore_in_room_${rm}`,
      category: 'Despacho',
      weight: 9,
      text: `Un hombre ocupaba el despacho ${rmName}.`,
      evalFn: (st) => !SUSPECTS[st.roomSuspect[rm]].isCarnivore
    });

    for (let otherId = 0; otherId < 5; otherId++) {
      if (otherId === speakerId) continue;
      clues.push({
        id: `other_${otherId}_in_room_${rm}`,
        category: 'Despacho',
        weight: 11,
        text: `${SUSPECTS[otherId].name} estaba en el despacho ${rmName}.`,
        evalFn: (st) => st.suspectRoom[otherId] === rm
      });
    }
  }

  return clues;
}

function generateCompleteLevel(
  enabledCategories = ['Umbral', 'Fachada', 'Claustrofobia', 'Escenario', 'Paranoia', 'Despacho'],
  seed = null
) {
  const rng = seed !== null ? createPrng(seed) : Math.random;
  const startTime = performance.now();
  let mapAttempts = 0;
  const activeCatSet = new Set(
    enabledCategories.length > 0 ? enabledCategories : Object.keys(CLUE_CATEGORIES)
  );

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
        caseNumber: seed !== null ? seed % 10000 : Math.floor(100 + Math.random() * 900),
        elapsedMs,
        mapAttempts,
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
// 4. COMPONENTE PRINCIPAL DE LA APLICACIÓN (ESTÉTICA MINIMALISTA TRADE REPUBLIC)
// ============================================================================

export default function App() {
  // Detección reactiva del tema del sistema operativo/navegador del usuario
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
  const [isDailyMode, setIsDailyMode] = useState(true);

  const [level, setLevel] = useState(() =>
    generateCompleteLevel(dailyConfig.categories, dailyConfig.seed)
  );
  // placements: diccionario "r,c" -> suspectId (0..4)
  const [placements, setPlacements] = useState({});
  // Sospechoso activo en las píldoras horizontales (0..4 -> A..E)
  const [activeSuspect, setActiveSuspect] = useState(0);
  // Cronómetro, estado de resolución y modales
  const [seconds, setSeconds] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const resetBoardState = (nextLevel) => {
    setLevel(nextLevel);
    setPlacements({});
    setActiveSuspect(0);
    setSeconds(0);
    setIsSolved(false);
    setIsShareModalOpen(false);
    setIsModeModalOpen(false);
    setCopiedShare(false);
  };

  // Cargar reto diario determinista
  const handleLoadDaily = useCallback(() => {
    setIsDailyMode(true);
    const nextLevel = generateCompleteLevel(dailyConfig.categories, dailyConfig.seed);
    if (nextLevel) {
      resetBoardState(nextLevel);
    }
  }, [dailyConfig]);

  // Generar un nuevo nivel aleatorio
  const handleNewRandomLevel = useCallback(() => {
    setIsDailyMode(false);
    const nextLevel = generateCompleteLevel();
    if (nextLevel) {
      resetBoardState(nextLevel);
    }
  }, []);

  // Medidor de dificultad minimalista monocromático
  const difficultyInfo = useMemo(() => {
    if (!level) return null;
    const k = level.survivingGeos.length; // K oscila entre 2 y 6
    const barColor = isDark ? 'bg-white' : 'bg-neutral-900';

    if (k <= 2) return { label: 'Fácil', bars: 1, barColor };
    if (k === 3) return { label: 'Media', bars: 2, barColor };
    if (k === 4) return { label: 'Difícil', bars: 3, barColor };
    if (k === 5) return { label: 'Experto', bars: 4, barColor };
    return { label: 'Maestro', bars: 5, barColor };
  }, [level, isDark]);

  // Mapa inverso: suspectId -> { r, c } si está colocado en el tablero
  const suspectPositions = useMemo(() => {
    const map = {};
    Object.entries(placements).forEach(([key, sId]) => {
      const [r, c] = key.split(',').map(Number);
      map[sId] = { r, c };
    });
    return map;
  }, [placements]);

  // Casillas invalidadas (marcadas con X gris automáticamente por los sospechosos colocados)
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

  // Validación en tiempo real de las reglas espaciales y declaraciones
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

  useEffect(() => {
    if (validation?.allCluesValid && !isSolved) {
      setIsSolved(true);
      setIsShareModalOpen(true);
    }
  }, [validation, isSolved]);

  // Cronómetro activo que se detiene automáticamente al finalizar el nivel
  useEffect(() => {
    if (gameWon) return;
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameWon]);

  // Clic en una celda de la cuadrícula 5x5
  const handleCellClick = (r, c) => {
    if (!level) return;
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
      ? `Caso diario (${dailyConfig.formattedDate})`
      : `Caso nº ${level?.caseNumber ?? ''}`;
    
    return `🥪 ¿Quién ha robado mi sandwich?\n📂 ${modeLabel}\n⏱️ Tiempo: ${formatTime(seconds)}\n\n¡A ver si me superas! 👇\nhttps://www.sandwichcase.io`;
  }, [isDailyMode, dailyConfig.formattedDate, level?.caseNumber, seconds]);

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
        // Fallback a copiar y abrir WhatsApp
      }
    }
    handleCopyShareText();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  if (!level) return null;

  const currentSuspect = SUSPECTS[activeSuspect];
  const currentClue = level.clues.find((c) => c.suspectId === activeSuspect);

  // Paleta gris neutro (estilo Trade Republic, sin subtonos azulados)
  const pageBgClass = isDark
    ? 'bg-[#0a0a0a] text-neutral-100'
    : 'bg-[#f7f7f7] text-neutral-900';
  const cardBgClass = isDark
    ? 'bg-[#141414] border-neutral-800'
    : 'bg-white border-neutral-200';
  const subTextClass = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const primaryActionBtnClass = isDark
    ? 'bg-white hover:bg-neutral-200 text-black'
    : 'bg-neutral-900 hover:bg-neutral-800 text-white';

  return (
    <div
      className={`min-h-dvh font-sans select-none flex flex-col items-center justify-start py-2 px-3 transition-colors duration-200 ${pageBgClass}`}
    >
      <div className="w-full max-w-[400px] flex flex-col gap-2">
        {/* 1. CABECERA PRINCIPAL: ICONO + TÍTULO/SUBTÍTULO A LA IZQUIERDA, CRONO A LA DERECHA */}
        <div className="flex items-center justify-between gap-2 py-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsModeModalOpen(true)}
              title="Cambiar entre reto diario y caso aleatorio"
              className={`p-1.5 rounded-xl border transition cursor-pointer shrink-0 flex items-center justify-center ${
                isDark
                  ? 'bg-[#141414] border-neutral-800 hover:border-neutral-600'
                  : 'bg-white border-neutral-200 hover:border-neutral-400 shadow-2xs'
              }`}
            >
              <img
                src={sandwichSvg}
                alt="Seleccionar modo"
                className="w-6 h-6 object-contain"
              />
            </button>

            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-base font-black tracking-tight truncate leading-tight">
                ¿Quién ha robado mi sandwich?
              </h1>

              {/* Subtítulo con Caso Diario/Fecha o Caso nº XXX + Nivel de dificultad */}
              <div className="flex items-center gap-1.5 text-[11px] mt-0.5 flex-wrap">
                <span className={`font-bold ${subTextClass}`}>
                  {isDailyMode
                    ? `Caso diario · ${dailyConfig.formattedDate}`
                    : `Caso nº ${level.caseNumber}`}
                </span>
                <span className={subTextClass}>•</span>
                <div
                  className="flex items-center gap-1"
                  title={`Dificultad: ${difficultyInfo.label}`}
                >
                  <span
                    className={`font-black uppercase tracking-wider text-[10px] ${
                      isDark ? 'text-neutral-300' : 'text-neutral-700'
                    }`}
                  >
                    {difficultyInfo.label}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <span
                        key={bar}
                        className={`w-1.5 h-1 rounded-xs ${
                          bar <= difficultyInfo.bars
                            ? difficultyInfo.barColor
                            : isDark
                            ? 'bg-neutral-800'
                            : 'bg-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cronómetro arriba a la derecha (+ botón Compartir si ya se resolvió) */}
          <div className="flex items-center gap-2 shrink-0">
            {gameWon && (
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className={`px-2.5 py-1 rounded-xl font-black text-[11px] flex items-center gap-1 transition cursor-pointer ${primaryActionBtnClass}`}
              >
                <Share2 className="w-3 h-3" />
                <span>Compartir</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  gameWon
                    ? isDark
                      ? 'bg-white'
                      : 'bg-neutral-900'
                    : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>
                {formatTime(seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. TABLERO 5x5 CON COLORES PASTEL, CRUCES GRISES Y CARDINALES */}
        <div className={`border rounded-2xl p-2.5 shadow-xs ${cardBgClass}`}>
          <div className="relative w-full aspect-square pt-5 pb-5 px-5">
            {/* NORTE */}
            <div className="absolute top-0 inset-x-0 h-5 flex items-center justify-center pointer-events-none">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                NORTE
              </span>
            </div>

            {/* SUR */}
            <div className="absolute bottom-0 inset-x-0 h-5 flex items-center justify-center pointer-events-none">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                SUR
              </span>
            </div>

            {/* OESTE */}
            <div className="absolute left-0 inset-y-0 w-5 flex items-center justify-center pointer-events-none">
              <span
                className={`text-[10px] font-black uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                OESTE
              </span>
            </div>

            {/* ESTE */}
            <div className="absolute right-0 inset-y-0 w-5 flex items-center justify-center pointer-events-none">
              <span
                className={`text-[10px] font-black uppercase tracking-widest [writing-mode:vertical-lr] ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                ESTE
              </span>
            </div>

            {/* CUADRÍCULA 5x5 */}
            <div className="relative w-full h-full">
              <div className="w-full h-full grid grid-cols-5 grid-rows-5 border-4 border-neutral-900 rounded-xl overflow-hidden bg-neutral-900 shadow-inner">
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

                    // Muros divisorios entre Despachos
                    const topWall = r > 0 && level.grid[r - 1][c] !== roomId;
                    const bottomWall = r < 4 && level.grid[r + 1][c] !== roomId;
                    const leftWall = c > 0 && level.grid[r][c - 1] !== roomId;
                    const rightWall = c < 4 && level.grid[r][c + 1] !== roomId;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCellClick(r, c)}
                        style={{
                          backgroundColor: roomObj.bgHex,
                          borderTop: topWall
                            ? '3px solid #171717'
                            : '1px solid rgba(23, 23, 23, 0.14)',
                          borderBottom: bottomWall
                            ? '3px solid #171717'
                            : '1px solid rgba(23, 23, 23, 0.14)',
                          borderLeft: leftWall
                            ? '3px solid #171717'
                            : '1px solid rgba(23, 23, 23, 0.14)',
                          borderRight: rightWall
                            ? '3px solid #171717'
                            : '1px solid rgba(23, 23, 23, 0.14)'
                        }}
                        className={`relative w-full h-full flex flex-col items-center justify-center p-0 overflow-hidden focus:outline-none cursor-pointer ${
                          hasConflict ? 'ring-3 ring-inset ring-rose-600 z-10' : ''
                        }`}
                      >
                        {/* Sandwich Robado */}
                        {isVase && (
                          <div className="flex flex-col items-center justify-center leading-none pointer-events-none">
                            <img
                              src={sandwichSvg}
                              alt="Sandwich robado"
                              className="w-8 h-8 object-contain"
                            />
                            <span className="text-[8px] font-black uppercase bg-neutral-900 text-white px-1 rounded mt-0.5">
                              CRIMEN
                            </span>
                          </div>
                        )}

                        {/* Sospechoso colocado (clicar lo quita) */}
                        {!isVase && placedSuspect && (
                          <div className="flex flex-col items-center justify-center leading-none pointer-events-none">
                            <img
                              src={placedSuspect.emoji}
                              alt={placedSuspect.name}
                              className="w-7 h-7 object-contain"
                            />
                            <span
                              className={`mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-black leading-tight ${
                                hasConflict
                                  ? 'bg-rose-600 text-white'
                                  : placedSuspect.id === activeSuspect
                                  ? 'bg-white text-black ring-1 ring-neutral-900 shadow-2xs'
                                  : 'bg-neutral-900 text-white'
                              }`}
                            >
                              {placedSuspect.code}
                            </span>
                          </div>
                        )}

                        {/* Crucecita gris (✕) automática de casilla bloqueada */}
                        {!isVase && !placedSuspect && isInvalidated && (
                          <span className="text-neutral-400 font-black text-lg leading-none pointer-events-none">
                            ✕
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* PUERTAS NUMERADAS (1, 2, 3, 4) */}
              {level.doors.map((door) => {
                const leftPct =
                  door.orientation === 'vertical'
                    ? (door.c1 + 1) * 20
                    : (door.c1 + 0.5) * 20;
                const topPct =
                  door.orientation === 'horizontal'
                    ? (door.r1 + 1) * 20
                    : (door.r1 + 0.5) * 20;

                return (
                  <div
                    key={door.number}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-neutral-950 text-white border-2 border-white flex items-center justify-center font-black text-[11px] shadow-md pointer-events-none"
                  >
                    {door.number}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AVISO JUSTO ENCIMA DE LAS PÍLDORAS DE SOSPECHOSOS (SIN ENVOLTORIO DE PÍLDORA) */}
        <div className="flex items-center justify-center py-0.5">
          <span
            className={`text-[11px] font-black uppercase tracking-wider ${
              isDark ? 'text-neutral-300' : 'text-neutral-700'
            }`}
          >
            ¡El que está en la sala del crimen miente!
          </span>
        </div>

        {/* 3. PÍLDORAS HORIZONTALES SELECTORAS DE PERSONAS (SELECCIÓN BLANCA EN MODO OSCURO) */}
        <div className="w-full grid grid-cols-5 gap-1.5 h-12">
          {SUSPECTS.map((s) => {
            const isSelected = activeSuspect === s.id;
            const isPlaced = suspectPositions[s.id] !== undefined;
            const evalRes = validation.clueResults ? validation.clueResults[s.id] : null;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSuspect(s.id)}
                className={`relative h-full rounded-xl font-black transition-all flex flex-col items-center justify-center border cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                    : isPlaced
                    ? isDark
                      ? 'bg-neutral-800/90 text-white border-neutral-600'
                      : 'bg-neutral-100 text-neutral-900 border-neutral-400'
                    : isDark
                    ? 'bg-[#141414] text-neutral-400 border-neutral-800 hover:bg-neutral-800/60'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {isPlaced && (
                  <span
                    className={`absolute top-1 right-1.5 w-2 h-2 rounded-full ${
                      evalRes && !evalRes.isConsistent ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                )}
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-sm font-black">{s.code}</span>
                  <img
                    src={s.emoji}
                    alt={s.name}
                    className="w-5 h-5 object-contain"
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

        {/* 4. DECLARACIÓN DEL SOSPECHOSO SELECCIONADO COMPACTA */}
        <div
          className={`w-full h-24 border rounded-2xl p-3 flex flex-col justify-between shadow-xs overflow-hidden ${cardBgClass}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-7 h-7 rounded-lg border flex items-center justify-center overflow-hidden shrink-0 ${
                  isDark
                    ? 'bg-neutral-800 border-neutral-700'
                    : 'bg-neutral-100 border-neutral-200'
                }`}
              >
                <img
                  src={currentSuspect.emoji}
                  alt={currentSuspect.name}
                  className="w-6 h-6 object-contain"
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
                    ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                }`}
              >
                {currentSuspect.isCarnivore ? 'Mujer' : 'Hombre'}
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-center">
            <p
              className={`text-xs sm:text-sm font-semibold leading-snug line-clamp-2 ${
                isDark ? 'text-neutral-100' : 'text-neutral-800'
              }`}
            >
              {currentClue?.text}
            </p>
          </div>
        </div>
      </div>

      {/* 5. POPUP MODAL DE SELECCIÓN DE MODO (AL PULSAR EL ICONO DEL SANDWICH) */}
      {isModeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsModeModalOpen(false)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl flex flex-col gap-4 ${
              isDark
                ? 'bg-[#141414] border-neutral-800 text-neutral-100'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center p-1.5 ${
                    isDark
                      ? 'bg-neutral-800 border-neutral-700'
                      : 'bg-neutral-100 border-neutral-200'
                  }`}
                >
                  <img
                    src={sandwichSvg}
                    alt="Sandwich"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-base font-black leading-tight">
                    Modo de juego
                  </h2>
                  <p className={`text-xs mt-0.5 ${subTextClass}`}>
                    Elige entre el reto del día o un caso aleatorio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModeModalOpen(false)}
                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Opción 1: Reto Diario */}
              <button
                type="button"
                onClick={handleLoadDaily}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                  isDailyMode
                    ? isDark
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-white border-neutral-900'
                    : isDark
                    ? 'bg-[#0a0a0a] hover:bg-neutral-800/80 text-neutral-200 border-neutral-800'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">Reto Diario</div>
                    <div
                      className={`text-[11px] ${
                        isDailyMode
                          ? isDark
                            ? 'text-neutral-700'
                            : 'text-neutral-300'
                          : subTextClass
                      }`}
                    >
                      Caso diario ({dailyConfig.formattedDate})
                    </div>
                  </div>
                </div>
                {isDailyMode && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                    Activo
                  </span>
                )}
              </button>

              {/* Opción 2: Caso Aleatorio */}
              <button
                type="button"
                onClick={handleNewRandomLevel}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                  !isDailyMode
                    ? isDark
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-white border-neutral-900'
                    : isDark
                    ? 'bg-[#0a0a0a] hover:bg-neutral-800/80 text-neutral-200 border-neutral-800'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shuffle className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">Caso Aleatorio</div>
                    <div
                      className={`text-[11px] ${
                        !isDailyMode
                          ? isDark
                            ? 'text-neutral-700'
                            : 'text-neutral-300'
                          : subTextClass
                      }`}
                    >
                      Generar un expediente nuevo al instante
                    </div>
                  </div>
                </div>
                {!isDailyMode && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                    Activo
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. POPUP MODAL DE COMPARTIR */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl flex flex-col gap-4 ${
              isDark
                ? 'bg-[#141414] border-neutral-800 text-neutral-100'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center p-1.5 ${
                    isDark
                      ? 'bg-neutral-800 border-neutral-700'
                      : 'bg-neutral-100 border-neutral-200'
                  }`}
                >
                  <img
                    src={sandwichSvg}
                    alt="Sandwich"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-base font-black leading-tight">
                    ¡Caso resuelto!
                  </h2>
                  <p className={`text-xs flex items-center gap-1.5 mt-0.5 ${subTextClass}`}>
                    <img
                      src={SUSPECTS[level.thiefId].emoji}
                      alt={SUSPECTS[level.thiefId].name}
                      className="w-4 h-4 object-contain"
                    />
                    <span>{SUSPECTS[level.thiefId].name} robó el sandwich</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resumen estadístico y vista previa del mensaje */}
            <div
              className={`rounded-2xl p-3.5 border text-xs font-mono whitespace-pre-line leading-relaxed ${
                isDark
                  ? 'bg-[#0a0a0a] border-neutral-800 text-neutral-300'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700'
              }`}
            >
              {shareText}
            </div>

            {/* Botones de acción en el popup */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleNativeOrWhatsAppShare}
                className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${primaryActionBtnClass}`}
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir resultado</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyShareText}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    isDark
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
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
                      <span>Copiar texto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNewRandomLevel}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    isDark
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Nivel aleatorio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Analytics />
    </div>
  );
}
