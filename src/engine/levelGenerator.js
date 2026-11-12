import {
  BASE_GEOMETRIES,
  PERMUTATIONS_120,
  COMPLEMENTARY_PAIR_SETS,
  ALL_CATEGORY_PAIRS
} from '../constants/gameData';
import { generateCandidateCluesForSuspect } from './clueGenerator';

export function createPrng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const shuffle = (array, rng = Math.random) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export function getDailyConfig(date = new Date()) {
  const epoch = new Date(2026, 0, 1).setHours(0, 0, 0, 0);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayIndex = Math.max(0, Math.round((today - epoch) / 86400000));

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateSeed = parseInt(`${y}${m}${d}`, 10);

  const cycleNumber = Math.floor(dayIndex / 15);
  const dayInCycle = dayIndex % 15;
  const cycleRng = createPrng(cycleNumber + 77777);

  const shuffledSets = shuffle(COMPLEMENTARY_PAIR_SETS, cycleRng);
  const setIdx = Math.floor(dayInCycle / 3);
  const posInSet = dayInCycle % 3;

  const shuffledGroup = shuffle(shuffledSets[setIdx], cycleRng);
  const dailyCategories = shuffledGroup[posInSet];

  return {
    dayNumber: dayIndex + 1,
    seed: dateSeed,
    categories: dailyCategories,
    formattedDate: `${d}/${m}/${y}`
  };
}

export function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diff = Math.max(0, Math.floor((midnight - now) / 1000));

  const h = String(Math.floor(diff / 3600)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const s = String(diff % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function getSeedFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const casoParam = params.get('caso');
  if (!casoParam) return null;
  const parsed = parseInt(casoParam, 10);
  return !Number.isNaN(parsed) && parsed > 0 ? parsed : null;
}

export function getSavedLevelState(storageKey) {
  if (typeof window === 'undefined' || !storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (_e) {
    return null;
  }
}

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

export function buildStateObject(geoIdx, geo, perm, grid, doors) {
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

export function generateCompleteLevel(enabledCategories = null, seed = null, isDaily = false) {
  const actualSeed =
    seed !== null ? seed : Math.floor(100000 + Math.random() * 900000);
  const rng = createPrng(actualSeed);
  const startTime = performance.now();
  let mapAttempts = 0;

  const categoriesToUse =
    enabledCategories && enabledCategories.length === 2
      ? enabledCategories
      : ALL_CATEGORY_PAIRS[Math.floor(rng() * ALL_CATEGORY_PAIRS.length)];

  const activeCatSet = new Set(categoriesToUse);
  const STEP_TARGET_RATIOS = [0.42, 0.42, 0.42, 0.38, 0.0];

  while (mapAttempts < 600) {
    mapAttempts++;

    const solGeoIdx = Math.floor(rng() * BASE_GEOMETRIES.length);
    const solGeo = BASE_GEOMETRIES[solGeoIdx];

    const roomData = generateRoomsAndVase(solGeo, rng);
    if (!roomData) continue;
    const { grid, vasePos, vaseRoom } = roomData;

    const survivingGeos = getSurvivingGeometries(grid, vasePos);
    const K = survivingGeos.length;

    if (isDaily) {
      if (K !== 3) continue;
    } else {
      if (K < 2 || K > 6) continue;
    }

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
        let trueWhenInnocentCount = 0;
        let falseWhenInnocentCount = 0;

        for (let i = 0; i < N; i++) {
          const st = states[i];
          const isThiefInS = st.suspectRoom[sId] === vaseRoom;
          const evalRes = clue.evalFn(st);
          if (!isThiefInS) {
            if (evalRes) trueWhenInnocentCount++;
            else falseWhenInnocentCount++;
          }
          if (evalRes === !isThiefInS) {
            compatIndices.push(i);
          }
        }

        if (trueWhenInnocentCount === 0 || falseWhenInnocentCount === 0) continue;

        if (compatIndices.length >= 2 && compatIndices.length < N * 0.88) {
          filtered.push({
            ...clue,
            compatSet: new Set(compatIndices),
            compatCount: compatIndices.length
          });
        }
      }

      if (
        filtered.length === 0 ||
        (sId === 0 && !filtered.some((c) => c.role === 'anchor' && c.isStrongAnchor))
      ) {
        poolEmpty = true;
        break;
      }

      validPools.push(shuffle(filtered, rng));
    }

    if (poolEmpty) continue;

    const hasSecondAnchor = [1, 2, 3, 4].some((id) =>
      validPools[id].some((c) => c.role === 'anchor')
    );
    const hasBoard = [1, 2, 3, 4].some((id) =>
      validPools[id].some((c) => c.role === 'board')
    );
    const hasRelational = [1, 2, 3, 4].some((id) =>
      validPools[id].some((c) => c.role === 'relational')
    );
    const hasParanoia = [1, 2, 3, 4].some((id) =>
      validPools[id].some((c) => c.role === 'paranoia')
    );

    if (!hasSecondAnchor || !hasBoard || !hasRelational || !hasParanoia) {
      continue;
    }

    let chosenClues = null;
    let fallbackClues = null;

    for (let searchTry = 0; searchTry < 150; searchTry++) {
      const otherSuspects = shuffle([1, 2, 3, 4], rng);
      const secondAnchorId = otherSuspects[0];
      const boardId = otherSuspects[1];
      const relationalId = otherSuspects[2];
      const paranoiaId = otherSuspects[3];

      const anchorSuspects = new Set([0, secondAnchorId]);

      const roleBySuspect = {
        0: 'anchor',
        [secondAnchorId]: 'anchor',
        [boardId]: 'board',
        [relationalId]: 'relational',
        [paranoiaId]: 'paranoia'
      };

      const firstId = rng() < 0.5 ? 0 : secondAnchorId;
      const restIds = shuffle(
        [0, 1, 2, 3, 4].filter((id) => id !== firstId),
        rng
      );
      const order = [firstId, ...restIds];

      let survivors = Array.from({ length: N }, (_, i) => i);
      const pickBySuspect = new Array(5);
      const usedCategories = new Set();
      const categoryCounts = {};
      const usedClueIds = new Set();
      const usedFamilies = new Set();

      for (let step = 0; step < 5; step++) {
        const sId = order[step];
        const requiredRole = roleBySuspect[sId];
        const pool = validPools[sId];
        let bestClue = null;
        let bestScore = Infinity;

        const targetNextCount =
          step === 4
            ? 1
            : Math.max(2, Math.round(survivors.length * STEP_TARGET_RATIOS[step]));

        for (let k = 0; k < pool.length; k++) {
          const cand = pool[k];

          if (cand.role !== requiredRole) continue;
          if (sId === 0 && !cand.isStrongAnchor) continue;
          if (requiredRole === 'relational' && !anchorSuspects.has(cand.targetId)) {
            continue;
          }
          if (usedClueIds.has(cand.id)) continue;
          if ((categoryCounts[cand.category] || 0) >= 3) continue;

          let nextCount = 0;
          for (let idx = 0; idx < survivors.length; idx++) {
            if (cand.compatSet.has(survivors[idx])) {
              nextCount++;
            }
          }

          if (nextCount === 0) continue;
          if (step === 4 && nextCount !== 1) continue;

          let score = Math.abs(nextCount - targetNextCount);

          if (step < 4 && nextCount === 1) {
            score += 120;
          }
          if (nextCount === survivors.length) {
            score += 90;
          }
          if (!usedCategories.has(cand.category)) {
            score -= 20;
          }
          if (cand.family && usedFamilies.has(cand.family)) {
            score += Math.max(30, survivors.length * 0.4);
          }

          const jitter = Math.max(8, survivors.length * 0.25);
          score += rng() * jitter - cand.weight * 0.4;

          if (score < bestScore) {
            bestScore = score;
            bestClue = cand;
          }
        }

        if (!bestClue) break;
        pickBySuspect[sId] = bestClue;
        usedCategories.add(bestClue.category);
        categoryCounts[bestClue.category] =
          (categoryCounts[bestClue.category] || 0) + 1;
        usedClueIds.add(bestClue.id);
        if (bestClue.family) usedFamilies.add(bestClue.family);

        survivors = survivors.filter((idx) => bestClue.compatSet.has(idx));
      }

      if (
        !pickBySuspect.includes(undefined) &&
        survivors.length === 1 &&
        survivors[0] === trueStateIdx &&
        usedCategories.size === 2 &&
        pickBySuspect[0].role === 'anchor' &&
        pickBySuspect[0].isStrongAnchor
      ) {
        let essentialCount = 0;
        for (let sId = 0; sId < 5; sId++) {
          let withoutThis = Array.from({ length: N }, (_, i) => i);
          for (let other = 0; other < 5; other++) {
            if (other === sId) continue;
            withoutThis = withoutThis.filter((idx) =>
              pickBySuspect[other].compatSet.has(idx)
            );
          }
          if (withoutThis.length > 1) essentialCount++;
        }

        if (essentialCount === 5) {
          chosenClues = pickBySuspect;
          break;
        } else if (essentialCount >= 4 && !fallbackClues) {
          fallbackClues = pickBySuspect;
        }
      }
    }

    const finalPick = chosenClues || fallbackClues;

    if (finalPick) {
      let runningSurvivors = Array.from({ length: N }, (_, i) => i);
      const clueCascade = [];
      for (let sId = 0; sId < 5; sId++) {
        runningSurvivors = runningSurvivors.filter((idx) =>
          finalPick[sId].compatSet.has(idx)
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
            finalPick[other].compatSet.has(idx)
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
        clues: finalPick.map((c, sId) => ({
          id: c.id,
          role: c.role,
          suspectId: sId,
          category: c.category,
          text: c.text,
          textEn: c.textEn,
          evalFn: c.evalFn,
          statesWithoutThisClue: clueImpact[sId]
        })),
        clueCascade
      };
    }
  }

  return null;
}
