import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Calendar,
  XCircle,
  Share2,
  Check
} from 'lucide-react';

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

// Colores pastel para las 5 estancias (con Sala Roja pastel)
const ROOMS = [
  {
    id: 0,
    name: 'Azul',
    bgHex: '#DBEAFE',
    bgActive: '#BFDBFE',
    borderHex: '#2563EB',
    badgeBg: 'bg-blue-950/90 text-blue-200 border-blue-700/80',
    dotColor: 'bg-blue-400'
  },
  {
    id: 1,
    name: 'Roja',
    bgHex: '#FEE2E2',
    bgActive: '#FECACA',
    borderHex: '#DC2626',
    badgeBg: 'bg-red-950/90 text-red-200 border-red-700/80',
    dotColor: 'bg-red-400'
  },
  {
    id: 2,
    name: 'Verde',
    bgHex: '#D1FAE5',
    bgActive: '#A7F3D0',
    borderHex: '#059669',
    badgeBg: 'bg-emerald-950/90 text-emerald-200 border-emerald-700/80',
    dotColor: 'bg-emerald-400'
  },
  {
    id: 3,
    name: 'Amarillo',
    bgHex: '#FEF9C3',
    bgActive: '#FEF08A',
    borderHex: '#CA8A04',
    badgeBg: 'bg-yellow-950/90 text-yellow-200 border-yellow-700/80',
    dotColor: 'bg-yellow-400'
  },
  {
    id: 4,
    name: 'Morado',
    bgHex: '#EDE9FE',
    bgActive: '#DDD6FE',
    borderHex: '#7C3AED',
    badgeBg: 'bg-purple-950/90 text-purple-200 border-purple-700/80',
    dotColor: 'bg-purple-400'
  }
];

const SUSPECTS = [
  { id: 0, code: 'A', name: 'Alce', emoji: '🫎', diet: 'Herbívoro', isCarnivore: false },
  { id: 1, code: 'B', name: 'Boa', emoji: '🐍', diet: 'Carnívora', isCarnivore: true },
  { id: 2, code: 'C', name: 'Caimán', emoji: '🐊', diet: 'Carnívoro', isCarnivore: true },
  { id: 3, code: 'D', name: 'Dodo', emoji: '🦤', diet: 'Herbívoro', isCarnivore: false },
  { id: 4, code: 'E', name: 'Elefante', emoji: '🐘', diet: 'Herbívoro', isCarnivore: false }
];

const CLUE_CATEGORIES = {
  Umbral: {
    id: 'Umbral',
    label: 'Umbral / Puertas',
    badge: 'bg-sky-950 text-sky-300 border-sky-800',
    desc: 'Proximidad a puertas numeradas, conectividad y callejones sin salida'
  },
  Fachada: {
    id: 'Fachada',
    label: 'Fachada / Cardinal',
    badge: 'bg-amber-950 text-amber-300 border-amber-800',
    desc: 'Muros exteriores Norte/Sur/Este/Oeste, esquinas e interior'
  },
  Claustrofobia: {
    id: 'Claustrofobia',
    label: 'Claustrofobia / Tamaño',
    badge: 'bg-purple-950 text-purple-300 border-purple-800',
    desc: 'Área en casillas del poliominó, salas más grandes o más pequeñas'
  },
  Escenario: {
    id: 'Escenario',
    label: 'Contacto Escenario',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    desc: 'Contacto ortogonal con muros de otras salas o con la leche derramada 🍶'
  },
  Paranoia: {
    id: 'Paranoia',
    label: 'Paranoia Cruzada',
    badge: 'bg-rose-950 text-rose-300 border-rose-800',
    desc: 'Acusaciones directas, dieta del ladrón y condicionales lógicos'
  },
  Estancia: {
    id: 'Estancia',
    label: 'Estancia / Dieta',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    desc: 'Ubicación directa por color de habitación o tipo de dieta'
  }
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
  [['Umbral', 'Fachada', 'Claustrofobia'], ['Escenario', 'Paranoia', 'Estancia']],
  [['Umbral', 'Fachada', 'Escenario'],     ['Claustrofobia', 'Paranoia', 'Estancia']],
  [['Umbral', 'Fachada', 'Paranoia'],      ['Claustrofobia', 'Escenario', 'Estancia']],
  [['Umbral', 'Fachada', 'Estancia'],      ['Claustrofobia', 'Escenario', 'Paranoia']],
  [['Umbral', 'Claustrofobia', 'Escenario'],['Fachada', 'Paranoia', 'Estancia']],
  [['Umbral', 'Claustrofobia', 'Paranoia'],['Fachada', 'Escenario', 'Estancia']],
  [['Umbral', 'Claustrofobia', 'Estancia'],['Fachada', 'Escenario', 'Paranoia']],
  [['Umbral', 'Escenario', 'Paranoia'],    ['Fachada', 'Claustrofobia', 'Estancia']],
  [['Umbral', 'Escenario', 'Estancia'],    ['Fachada', 'Claustrofobia', 'Paranoia']],
  [['Umbral', 'Paranoia', 'Estancia'],     ['Fachada', 'Claustrofobia', 'Escenario']]
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
      text: `«Yo estaba apostado junto a la puerta ${dNum}.»`,
      evalFn: (st) => st.doorOccupant[dNum] === speakerId
    });

    clues.push({
      id: `nobody_door_${dNum}`,
      category: 'Umbral',
      weight: 11,
      text: `«Nadie vigilaba junto a la puerta ${dNum}.»`,
      evalFn: (st) => st.doorOccupant[dNum] === -1
    });

    clues.push({
      id: `someone_door_${dNum}`,
      category: 'Umbral',
      weight: 11,
      text: `«Vi a alguien apostado junto a la puerta ${dNum}.»`,
      evalFn: (st) => st.doorOccupant[dNum] !== -1
    });

    clues.push({
      id: `carnivore_door_${dNum}`,
      category: 'Umbral',
      weight: 14,
      text: `«Un carnívoro merodeaba junto a la puerta ${dNum}.»`,
      evalFn: (st) => {
        const occ = st.doorOccupant[dNum];
        return occ !== -1 && SUSPECTS[occ].isCarnivore;
      }
    });

    clues.push({
      id: `herbivore_door_${dNum}`,
      category: 'Umbral',
      weight: 13,
      text: `«Un herbívoro estaba junto a la puerta ${dNum}.»`,
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
        text: `«${SUSPECTS[otherId].name} estaba junto a la puerta ${dNum}.»`,
        evalFn: (st) => st.doorOccupant[dNum] === otherId
      });
    }
  }

  clues.push({
    id: `self_even_door`,
    category: 'Umbral',
    weight: 14,
    text: `«Yo estaba junto a una puerta par (2 o 4).»`,
    evalFn: (st) => st.doorOccupant[2] === speakerId || st.doorOccupant[4] === speakerId
  });

  clues.push({
    id: `self_odd_door`,
    category: 'Umbral',
    weight: 14,
    text: `«Yo estaba junto a una puerta impar (1 o 3).»`,
    evalFn: (st) => st.doorOccupant[1] === speakerId || st.doorOccupant[3] === speakerId
  });

  clues.push({
    id: `room_dead_end`,
    category: 'Umbral',
    weight: 15,
    text: `«Mi estancia es un callejón sin salida (solo tiene 1 puerta numerada).»`,
    evalFn: (st) => roomDoors[st.suspectRoom[speakerId]].length === 1
  });

  clues.push({
    id: `room_multi_doors`,
    category: 'Umbral',
    weight: 13,
    text: `«Mi estancia cuenta con al menos 2 puertas numeradas en sus muros.»`,
    evalFn: (st) => roomDoors[st.suspectRoom[speakerId]].length >= 2
  });

  clues.push({
    id: `room_no_even_doors`,
    category: 'Umbral',
    weight: 14,
    text: `«Mi estancia no tiene ninguna puerta par en sus muros.»`,
    evalFn: (st) => {
      const dList = roomDoors[st.suspectRoom[speakerId]];
      return !dList.includes(2) && !dList.includes(4);
    }
  });

  clues.push({
    id: `room_no_odd_doors`,
    category: 'Umbral',
    weight: 14,
    text: `«Mi estancia no tiene ninguna puerta impar en sus muros.»`,
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
        text: `«La estancia de ${SUSPECTS[otherId].name} y la mía están conectadas por la puerta ${dNum}.»`,
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
      text: `«La sala del otro carnívoro y la mía están comunicadas por una puerta par.»`,
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
      text: `«La sala del otro carnívoro y la mía están comunicadas por una puerta impar.»`,
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
    text: `«Me situé pegado a la fachada Norte de la mansión.»`,
    evalFn: (st) => st.suspectRow[speakerId] === 0
  });

  clues.push({
    id: `facade_south`,
    category: 'Fachada',
    weight: 16,
    text: `«Me situé pegado a la fachada Sur de la mansión.»`,
    evalFn: (st) => st.suspectRow[speakerId] === 4
  });

  clues.push({
    id: `facade_west`,
    category: 'Fachada',
    weight: 16,
    text: `«Estaba junto al ventanal de la fachada Oeste.»`,
    evalFn: (st) => st.suspectCol[speakerId] === 0
  });

  clues.push({
    id: `facade_east`,
    category: 'Fachada',
    weight: 16,
    text: `«Estaba junto al ventanal de la fachada Este.»`,
    evalFn: (st) => st.suspectCol[speakerId] === 4
  });

  clues.push({
    id: `facade_corner`,
    category: 'Fachada',
    weight: 17,
    text: `«Me oculté en una de las 4 esquinas exteriores de la mansión.»`,
    evalFn: (st) =>
      (st.suspectRow[speakerId] === 0 || st.suspectRow[speakerId] === 4) &&
      (st.suspectCol[speakerId] === 0 || st.suspectCol[speakerId] === 4)
  });

  clues.push({
    id: `facade_interior`,
    category: 'Fachada',
    weight: 15,
    text: `«Me mantuve en el interior de la mansión, sin tocar ninguna fachada exterior.»`,
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
      text: `«Yo estaba más al Norte que ${SUSPECTS[otherId].name}.»`,
      evalFn: (st) => st.suspectRow[speakerId] < st.suspectRow[otherId]
    });

    clues.push({
      id: `more_west_than_${otherId}`,
      category: 'Fachada',
      weight: 14,
      text: `«Yo estaba más al Oeste que ${SUSPECTS[otherId].name}.»`,
      evalFn: (st) => st.suspectCol[speakerId] < st.suspectCol[otherId]
    });
  }

  // 3. Claustrofobia / Tamaño
  if (largestRooms.length === 1) {
    clues.push({
      id: `self_largest_room`,
      category: 'Claustrofobia',
      weight: 16,
      text: `«Me escondí en la estancia más grande de toda la mansión (${maxSize} casillas).»`,
      evalFn: (st) => st.suspectRoom[speakerId] === largestRooms[0]
    });
  }

  if (smallestRooms.length === 1) {
    clues.push({
      id: `self_smallest_room`,
      category: 'Claustrofobia',
      weight: 16,
      text: `«Me escondí en la estancia más pequeña de la mansión (${minSize} casillas).»`,
      evalFn: (st) => st.suspectRoom[speakerId] === smallestRooms[0]
    });
  }

  const uniqueSizes = Array.from(new Set(roomSizes));
  for (const sz of uniqueSizes) {
    clues.push({
      id: `self_room_size_${sz}`,
      category: 'Claustrofobia',
      weight: 15,
      text: `«Mi estancia tiene una superficie exacta de ${sz} casillas.»`,
      evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] === sz
    });
  }

  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;
    clues.push({
      id: `bigger_room_than_${otherId}`,
      category: 'Claustrofobia',
      weight: 14,
      text: `«Mi estancia tiene más casillas que la estancia de ${SUSPECTS[otherId].name}.»`,
      evalFn: (st) =>
        roomSizes[st.suspectRoom[speakerId]] > roomSizes[st.suspectRoom[otherId]]
    });
  }

  // 4. Contacto con Escenario (Leche 🍶)
  clues.push({
    id: `adj_to_vase_orth`,
    category: 'Escenario',
    weight: 18,
    text: `«Mi casilla estaba pegada ortogonalmente a la leche derramada (🍶), aunque hubiera muro en medio.»`,
    evalFn: (st) =>
      Math.abs(st.suspectRow[speakerId] - vasePos.r) +
        Math.abs(st.suspectCol[speakerId] - vasePos.c) ===
      1
  });

  clues.push({
    id: `adj_to_vase_king`,
    category: 'Escenario',
    weight: 17,
    text: `«Estaba a solo una casilla de distancia (incluso en diagonal) de la leche derramada (🍶).»`,
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
      text: `«Desde mi casilla tocaba por fuera el muro divisorio de la sala ${rmName}.»`,
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
      text: `«${SUSPECTS[otherId].name} está mintiendo en su declaración.»`,
      evalFn: (st) => st.suspectRoom[otherId] === vaseRoom
    });

    clues.push({
      id: `vouch_${otherId}`,
      category: 'Paranoia',
      weight: 13,
      text: `«Puedo asegurar que ${SUSPECTS[otherId].name} es inocente y dice la verdad.»`,
      evalFn: (st) => st.suspectRoom[otherId] !== vaseRoom
    });
  }

  clues.push({
    id: `thief_is_carnivore`,
    category: 'Paranoia',
    weight: 16,
    text: `«El ladrón que miente es un carnívoro.»`,
    evalFn: (st) => SUSPECTS[st.roomSuspect[vaseRoom]].isCarnivore
  });

  clues.push({
    id: `thief_is_herbivore`,
    category: 'Paranoia',
    weight: 15,
    text: `«El ladrón que robó la leche es un herbívoro.»`,
    evalFn: (st) => !SUSPECTS[st.roomSuspect[vaseRoom]].isCarnivore
  });

  clues.push({
    id: `thief_on_north_half`,
    category: 'Paranoia',
    weight: 16,
    text: `«El ladrón se ocultó en las dos primeras filas del Norte.»`,
    evalFn: (st) => st.suspectRow[st.roomSuspect[vaseRoom]] <= 1
  });

  clues.push({
    id: `thief_at_some_door`,
    category: 'Paranoia',
    weight: 16,
    text: `«El ladrón estaba apostado junto a una de las 4 puertas numeradas.»`,
    evalFn: (st) => {
      const thiefInS = st.roomSuspect[vaseRoom];
      return st.suspectDoors[thiefInS].length > 0;
    }
  });

  // 6. Estancia / Dieta
  for (let rm = 0; rm < 5; rm++) {
    const rmName = ROOMS[rm].name.toLowerCase();

    clues.push({
      id: `self_in_room_${rm}`,
      category: 'Estancia',
      weight: 9,
      text: `«Yo estaba en la sala ${rmName}.»`,
      evalFn: (st) => st.suspectRoom[speakerId] === rm
    });

    clues.push({
      id: `carnivore_in_room_${rm}`,
      category: 'Estancia',
      weight: 11,
      text: `«Un carnívoro ocupaba la sala ${rmName}.»`,
      evalFn: (st) => SUSPECTS[st.roomSuspect[rm]].isCarnivore
    });

    clues.push({
      id: `herbivore_in_room_${rm}`,
      category: 'Estancia',
      weight: 9,
      text: `«Un herbívoro ocupaba la sala ${rmName}.»`,
      evalFn: (st) => !SUSPECTS[st.roomSuspect[rm]].isCarnivore
    });

    for (let otherId = 0; otherId < 5; otherId++) {
      if (otherId === speakerId) continue;
      clues.push({
        id: `other_${otherId}_in_room_${rm}`,
        category: 'Estancia',
        weight: 11,
        text: `«${SUSPECTS[otherId].name} estaba en la sala ${rmName}.»`,
        evalFn: (st) => st.suspectRoom[otherId] === rm
      });
    }
  }

  return clues;
}

function generateCompleteLevel(
  enabledCategories = ['Umbral', 'Fachada', 'Claustrofobia', 'Escenario', 'Paranoia', 'Estancia'],
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
          if (cand.category !== 'Estancia') {
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
// 4. COMPONENTE PRINCIPAL DE LA APLICACIÓN (DISEÑO MÓVIL SIN SALTOS VISUALES)
// ============================================================================

export default function App() {
  const dailyConfig = useMemo(() => getDailyConfig(), []);
  const [isDailyMode, setIsDailyMode] = useState(true);
  const [enabledCategories, setEnabledCategories] = useState(dailyConfig.categories);

  const [level, setLevel] = useState(() =>
    generateCompleteLevel(dailyConfig.categories, dailyConfig.seed)
  );
  // placements: diccionario "r,c" -> suspectId (0..4)
  const [placements, setPlacements] = useState({});
  // Sospechoso activo en las píldoras horizontales (0..4 -> A..E)
  const [activeSuspect, setActiveSuspect] = useState(0);
  // Cronómetro y estado de resolución
  const [seconds, setSeconds] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const resetBoardState = (nextLevel) => {
    setLevel(nextLevel);
    setPlacements({});
    setActiveSuspect(0);
    setSeconds(0);
    setIsSolved(false);
    setCopiedShare(false);
  };

  // Cargar reto diario determinista
  const handleLoadDaily = useCallback(() => {
    setIsDailyMode(true);
    setEnabledCategories(dailyConfig.categories);
    const nextLevel = generateCompleteLevel(dailyConfig.categories, dailyConfig.seed);
    if (nextLevel) {
      resetBoardState(nextLevel);
    }
  }, [dailyConfig]);

  // Generar un nuevo caso libre
  const handleNewCase = useCallback(() => {
    setIsDailyMode(false);
    const nextLevel = generateCompleteLevel();
    if (nextLevel) {
      resetBoardState(nextLevel);
    }
  }, []);

  // Medidor de dificultad basado en el número de geometrías válidas (K) del embudo
  const difficultyInfo = useMemo(() => {
    if (!level) return null;
    const k = level.survivingGeos.length; // K oscila entre 2 y 6
    if (k <= 2) {
      return {
        label: 'Fácil',
        bars: 1,
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        barColor: 'bg-emerald-400'
      };
    }
    if (k === 3) {
      return {
        label: 'Media',
        bars: 2,
        badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        barColor: 'bg-sky-400'
      };
    }
    if (k === 4) {
      return {
        label: 'Difícil',
        bars: 3,
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        barColor: 'bg-amber-400'
      };
    }
    if (k === 5) {
      return {
        label: 'Experto',
        bars: 4,
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        barColor: 'bg-orange-400'
      };
    }
    return {
      label: 'Maestro',
      bars: 5,
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      barColor: 'bg-rose-500'
    };
  }, [level]);

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

    Object.entries(placements).forEach(([key, _sId]) => {
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

  // Clic en una celda de la cuadrícula 5x5:
  // - Si la celda ya tiene un sospechoso -> lo elimina (y desaparecen sus X grises)
  // - Si la celda está libre -> coloca al sospechoso activo (y marca sus X grises)
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

  // Resolver automáticamente
  const handleRevealSolution = () => {
    if (!level) return;
    const solPlacements = {};
    for (let sId = 0; sId < 5; sId++) {
      const r = level.trueState.suspectRow[sId];
      const c = level.trueState.suspectCol[sId];
      solPlacements[`${r},${c}`] = sId;
    }
    setPlacements(solPlacements);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Compartir por WhatsApp o menú nativo del móvil con el texto exacto solicitado
  const handleShare = async () => {
    const shareText = `🍶 ¿Quién robó la leche? (${dailyConfig.formattedDate})\n⏱️ Lo descubrí en ${formatTime(
      seconds
    )} min.\n¡A ver si mejoras mi tiempo! 👇\nhttps://who-stole-my-milk.vercel.app/`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch (_err) {
        // Si se cancela el diálogo nativo, abrimos WhatsApp y copiamos al portapapeles
      }
    }

    navigator.clipboard?.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  if (!level) return null;

  const currentSuspect = SUSPECTS[activeSuspect];
  const currentClue = level.clues.find((c) => c.suspectId === activeSuspect);
  const currentPos = suspectPositions[activeSuspect];
  const currentRoomObj = currentPos ? ROOMS[level.grid[currentPos.r][currentPos.c]] : null;

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans select-none flex flex-col items-center justify-start py-4 px-4">
      {/* CONTENEDOR MÓVIL CON MAYOR ESPACIADO ENTRE ELEMENTOS Y ALTURA ESTABLE */}
      <div className="w-full max-w-[410px] flex flex-col gap-4">
        
        {/* 1. CABECERA + TEMPORIZADOR ARRIBA A LA DERECHA + MEDIDOR DE DIFICULTAD */}
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                🍶
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-black tracking-tight text-white truncate">
                    ¿Quién robó la leche?
                  </h1>
                </div>
                <p className="text-[11px] text-slate-400 leading-none mt-1 truncate">
                  {isDailyMode ? `Diario #${dailyConfig.dayNumber}` : `Caso #${level.caseNumber}`} &bull; Sala {ROOMS[level.vaseRoom].name} (🍶)
                </p>
              </div>
            </div>

            {/* Controles rápidos y Temporizador arriba a la derecha */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPlacements({});
                  setIsSolved(false);
                }}
                title="Limpiar tablero"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRevealSolution}
                title="Ver solución"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={isDailyMode ? handleNewCase : handleLoadDaily}
                title={isDailyMode ? 'Jugar caso aleatorio' : 'Volver al caso diario'}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer transition"
              >
                {isDailyMode ? (
                  <Sparkles className="w-3.5 h-3.5" />
                ) : (
                  <Calendar className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Temporizador arriba a la derecha */}
              <div className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-inner">
                <span
                  className={`w-2 h-2 rounded-full ${
                    gameWon ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <span>{formatTime(seconds)}</span>
              </div>
            </div>
          </div>

          {/* Barra de Dificultad según el Embudo Algorítmico (Geometrías Válidas K) */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-md font-black uppercase tracking-wider border text-[10px] ${difficultyInfo.badgeClass}`}
              >
                {difficultyInfo.label}
              </span>
              <div className="flex items-center gap-1" title="Nivel de dificultad según geometrías válidas">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <span
                    key={bar}
                    className={`w-2.5 h-1.5 rounded-xs ${
                      bar <= difficultyInfo.bars ? difficultyInfo.barColor : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>
                Embudo: <strong className="text-white">{level.survivingGeos.length}</strong> geom. ({level.totalStates} est.)
              </span>
            </div>
          </div>
        </header>

        {/* 2. BARRA DE ESTADO DE ALTURA FIJA (CON BOTÓN DE COMPARTIR AL GANAR) */}
        <div className="h-11 rounded-2xl px-3.5 flex items-center justify-between text-xs font-bold border bg-slate-900 border-slate-800 shadow-sm">
          {gameWon ? (
            <div className="w-full flex items-center justify-between gap-2 text-emerald-400">
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  ¡Fue {SUSPECTS[level.thiefId].name} en {formatTime(seconds)}!
                </span>
              </span>
              <button
                type="button"
                onClick={handleShare}
                className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartir</span>
                  </>
                )}
              </button>
            </div>
          ) : validation.conflicts.size > 0 ? (
            <div className="w-full flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1.5 truncate">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Conflicto de posición entre sospechosos</span>
              </span>
              <span className="text-[10px] font-mono">{validation.placedCount}/5</span>
            </div>
          ) : validation.placedCount === 5 ? (
            <div className="w-full flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1.5 truncate">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Alguna declaración no cuadra con la sala 🍶</span>
              </span>
              <span className="text-[10px] font-mono">5/5</span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between text-slate-400">
              <span className="truncate">
                Toca una celda para colocar a <strong className="text-white">{currentSuspect.code} ({currentSuspect.name})</strong>
              </span>
              <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                {validation.placedCount}/5
              </span>
            </div>
          )}
        </div>

        {/* 3. TABLERO 5x5 CON COLORES PASTEL, CRUCES GRISES Y CARDINALES SIN FLECHAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md">
          <div className="relative w-full aspect-square pt-6 pb-6 px-6">
            {/* NORTE (sin flechas) */}
            <div className="absolute top-0 inset-x-0 h-6 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                NORTE
              </span>
            </div>

            {/* SUR (sin flechas) */}
            <div className="absolute bottom-0 inset-x-0 h-6 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                SUR
              </span>
            </div>

            {/* OESTE (sin flechas) */}
            <div className="absolute left-0 inset-y-0 w-6 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 [writing-mode:vertical-lr] rotate-180">
                OESTE
              </span>
            </div>

            {/* ESTE (sin flechas) */}
            <div className="absolute right-0 inset-y-0 w-6 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 [writing-mode:vertical-lr]">
                ESTE
              </span>
            </div>

            {/* CUADRÍCULA 5x5 */}
            <div className="relative w-full h-full">
              <div className="w-full h-full grid grid-cols-5 grid-rows-5 border-4 border-slate-950 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
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

                    // Muros divisorios entre estancias
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
                            ? '3px solid #0f172a'
                            : '1px solid rgba(15, 23, 42, 0.14)',
                          borderBottom: bottomWall
                            ? '3px solid #0f172a'
                            : '1px solid rgba(15, 23, 42, 0.14)',
                          borderLeft: leftWall
                            ? '3px solid #0f172a'
                            : '1px solid rgba(15, 23, 42, 0.14)',
                          borderRight: rightWall
                            ? '3px solid #0f172a'
                            : '1px solid rgba(15, 23, 42, 0.14)'
                        }}
                        className={`relative w-full h-full flex flex-col items-center justify-center p-0 overflow-hidden focus:outline-none cursor-pointer ${
                          hasConflict ? 'ring-3 ring-inset ring-rose-600 z-10' : ''
                        }`}
                      >
                        {/* Leche Robada 🍶 */}
                        {isVase && (
                          <div className="flex flex-col items-center justify-center leading-none pointer-events-none">
                            <span className="text-xl">🍶</span>
                            <span className="text-[8px] font-black uppercase bg-rose-600 text-white px-1 rounded mt-0.5">
                              ROBO
                            </span>
                          </div>
                        )}

                        {/* Sospechoso colocado (clicar lo quita) */}
                        {!isVase && placedSuspect && (
                          <div className="flex flex-col items-center justify-center leading-none pointer-events-none">
                            <span className="text-xl leading-none">{placedSuspect.emoji}</span>
                            <span
                              className={`mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-black leading-tight ${
                                hasConflict
                                  ? 'bg-rose-600 text-white'
                                  : placedSuspect.id === activeSuspect
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-900 text-white'
                              }`}
                            >
                              {placedSuspect.code}
                            </span>
                          </div>
                        )}

                        {/* Crucecita gris (✕) automática de casilla bloqueada */}
                        {!isVase && !placedSuspect && isInvalidated && (
                          <span className="text-slate-400 font-black text-lg leading-none pointer-events-none">
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
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-slate-950 text-white border-2 border-white flex items-center justify-center font-black text-[11px] shadow-md pointer-events-none"
                  >
                    {door.number}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. PÍLDORAS HORIZONTALES (A, B, C, D, E) */}
        <div className="w-full grid grid-cols-5 gap-2 h-14">
          {SUSPECTS.map((s) => {
            const isSelected = activeSuspect === s.id;
            const isPlaced = suspectPositions[s.id] !== undefined;
            const evalRes = validation.clueResults ? validation.clueResults[s.id] : null;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSuspect(s.id)}
                className={`relative h-full rounded-2xl font-black transition-colors flex flex-col items-center justify-center border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : isPlaced
                    ? 'bg-slate-800 text-white border-emerald-500/60'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {isPlaced && (
                  <span
                    className={`absolute top-1.5 right-2 w-2 h-2 rounded-full ${
                      evalRes && !evalRes.isConsistent ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                  />
                )}
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-base font-black">{s.code}</span>
                  <span className="text-sm">{s.emoji}</span>
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 truncate max-w-full px-1 ${
                    isSelected ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* 5. DECLARACIÓN DEL SOSPECHOSO SELECCIONADO (MISMO ANCHO QUE PÍLDORAS Y ALTURA FIJA) */}
        <div className="w-full h-36 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-base shrink-0">
                {currentSuspect.emoji}
              </span>
              <span className="font-black text-xs text-white truncate">
                {currentSuspect.code} — {currentSuspect.name}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  currentSuspect.isCarnivore
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                }`}
              >
                {currentSuspect.isCarnivore ? '🥩 Carnívoro' : '🌿 Herbívoro'}
              </span>
            </div>

            <div className="shrink-0">
              {currentRoomObj ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentRoomObj.badgeBg}`}>
                  Sala {currentRoomObj.name}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-500">
                  Sin colocar
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center my-1">
            <p className="text-xs sm:text-sm font-semibold text-amber-100 leading-snug line-clamp-3">
              {currentClue?.text}
            </p>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>
              Categoría: <strong className="text-slate-300">{currentClue?.category}</strong>
            </span>
            <span>
              {currentPos
                ? `Casilla (${currentPos.r + 1}, ${currentPos.c + 1}) • Toca en la red para quitar`
                : 'Toca una casilla libre para colocar'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
