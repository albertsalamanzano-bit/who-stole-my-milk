import { ROOMS, SUSPECTS } from '../constants/gameData';

export function getClueRole(clue) {
  if (clue.role) return clue.role;
  const id = clue.id;

  if (
    id.startsWith('accuse_') ||
    id.startsWith('vouch_') ||
    id.startsWith('thief_')
  ) {
    return 'paranoia';
  }

  if (
    id.startsWith('self_') ||
    id.startsWith('room_') ||
    id.startsWith('facade_') ||
    id.endsWith('_half_rows') ||
    id.endsWith('_half_cols') ||
    id === 'central_axes' ||
    id === 'main_diagonals' ||
    id === 'knight_to_vase' ||
    id.startsWith('adj_to_vase_') ||
    id.startsWith('same_') ||
    id === 'no_line_as_vase' ||
    id.startsWith('more_') ||
    id.startsWith('adj_row_to_vase') ||
    id.startsWith('adj_col_to_vase') ||
    id === 'touch_many_rooms' ||
    id === 'touch_exactly_one_room' ||
    id === 'deep_inside_room' ||
    id === 'touch_crime_room_wall' ||
    id.startsWith('touch_wall_of_room_') ||
    id.startsWith('no_touch_wall_of_room_')
  ) {
    return 'anchor';
  }

  if (
    id.startsWith('nobody_') ||
    id.startsWith('someone_') ||
    id.startsWith('carnivore_') ||
    id.startsWith('herbivore_') ||
    id === 'even_doors_empty' ||
    id === 'odd_doors_empty' ||
    id === 'two_doors_occupied' ||
    id.startsWith('woman_') ||
    id.startsWith('man_') ||
    id.startsWith('women_adj_')
  ) {
    return 'board';
  }

  return 'relational';
}

export function generateCandidateCluesForSuspect(
  speakerId,
  grid,
  vasePos,
  vaseRoom,
  doors,
  topo
) {
  const clues = [];
  const speaker = SUSPECTS[speakerId];
  const isFem = speaker.isCarnivore;
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

  // ==========================================================================
  // 1. UMBRAL / PUERTAS
  // ==========================================================================
  for (let dNum = 1; dNum <= 4; dNum++) {
    clues.push({
      id: `self_door_${dNum}`,
      role: 'anchor',
      isStrongAnchor: true,
      family: 'self_specific_door',
      category: 'Umbral',
      weight: 15,
      text: `Me quedé tomando un café junto a la **puerta ${dNum}**`,
      textEn: `I stayed having a coffee right by **door ${dNum}**`,
      evalFn: (st) => st.doorOccupant[dNum] === speakerId
    });

    clues.push({
      id: `room_has_door_${dNum}`,
      role: 'anchor',
      isStrongAnchor: true,
      family: 'room_specific_door',
      category: 'Umbral',
      weight: 14,
      text: `En los tabiques de mi despacho está la **puerta ${dNum}**`,
      textEn: `**Door ${dNum}** is on the walls of my office`,
      evalFn: (st) => roomDoors[st.suspectRoom[speakerId]].includes(dNum)
    });
  }

  clues.push({
    id: `self_even_door`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_door_parity',
    category: 'Umbral',
    weight: 14,
    text: `Me quedé vigilando una **puerta par (2 o 4)**`,
    textEn: `I stayed watching an **even door (2 or 4)**`,
    evalFn: (st) => st.doorOccupant[2] === speakerId || st.doorOccupant[4] === speakerId
  });

  clues.push({
    id: `self_odd_door`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_door_parity',
    category: 'Umbral',
    weight: 14,
    text: `Estaba junto a una **puerta impar (1 o 3)**`,
    textEn: `I was next to an **odd door (1 or 3)**`,
    evalFn: (st) => st.doorOccupant[1] === speakerId || st.doorOccupant[3] === speakerId
  });

  clues.push({
    id: `self_no_door`,
    role: 'anchor',
    isStrongAnchor: false,
    family: 'self_door_presence',
    category: 'Umbral',
    weight: 13,
    text: `Me coloqué **lejos de las 4 puertas**, sin vigilar ninguna`,
    textEn: `I stood **away from all 4 doors**, watching none`,
    evalFn: (st) => st.suspectDoors[speakerId].length === 0
  });

  clues.push({
    id: `room_dead_end`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'room_door_count',
    category: 'Umbral',
    weight: 15,
    text: `Mi despacho es una ratonera: solo tiene **1 puerta numerada**`,
    textEn: `My office is a dead end: it only has **1 numbered door**`,
    evalFn: (st) => roomDoors[st.suspectRoom[speakerId]].length === 1
  });

  // Board (8)
  clues.push({
    id: `even_doors_empty`,
    role: 'board',
    family: 'global_doors_parity',
    category: 'Umbral',
    weight: 15,
    text: `Las **puertas pares (2 y 4)** estaban completamente **desiertas**`,
    textEn: `The **even doors (2 and 4)** were completely **deserted**`,
    evalFn: (st) => st.doorOccupant[2] === -1 && st.doorOccupant[4] === -1
  });

  clues.push({
    id: `odd_doors_empty`,
    role: 'board',
    family: 'global_doors_parity',
    category: 'Umbral',
    weight: 15,
    text: `No había **nadie** vigilando las **puertas impares (1 y 3)**`,
    textEn: `There was **nobody** watching the **odd doors (1 and 3)**`,
    evalFn: (st) => st.doorOccupant[1] === -1 && st.doorOccupant[3] === -1
  });

  clues.push({
    id: `woman_at_some_door`,
    role: 'board',
    family: 'global_doors_gender',
    category: 'Umbral',
    weight: 14,
    text: `Había **al menos una mujer** cotilleando junto a una **puerta numerada**`,
    textEn: `There was **at least one woman** gossiping by a **numbered door**`,
    evalFn: (st) =>
      SUSPECTS.some((s) => s.isCarnivore && st.suspectDoors[s.id].length > 0)
  });

  clues.push({
    id: `no_woman_at_doors`,
    role: 'board',
    family: 'global_doors_gender',
    category: 'Umbral',
    weight: 14,
    text: `**Ninguna mujer** estaba vigilando las **puertas numeradas**`,
    textEn: `**No woman** was watching the **numbered doors**`,
    evalFn: (st) =>
      SUSPECTS.every((s) => !s.isCarnivore || st.suspectDoors[s.id].length === 0)
  });

  clues.push({
    id: `at_least_two_doors_occupied`,
    role: 'board',
    family: 'global_doors_count',
    category: 'Umbral',
    weight: 14,
    text: `Había **al menos 2 puertas numeradas** vigiladas por alguien`,
    textEn: `There were **at least 2 numbered doors** being watched by someone`,
    evalFn: (st) =>
      [1, 2, 3, 4].filter((dNum) => st.doorOccupant[dNum] !== -1).length >= 2
  });

  clues.push({
    id: `at_most_one_door_occupied`,
    role: 'board',
    family: 'global_doors_count',
    category: 'Umbral',
    weight: 14,
    text: `Como mucho había **1 puerta numerada** vigilada en toda la oficina`,
    textEn: `At most **1 numbered door** was being watched in the whole office`,
    evalFn: (st) =>
      [1, 2, 3, 4].filter((dNum) => st.doorOccupant[dNum] !== -1).length <= 1
  });

  clues.push({
    id: `crime_room_door_occupied`,
    role: 'board',
    family: 'board_crime_doors',
    category: 'Umbral',
    weight: 15,
    text: `Había **alguien** vigilando una puerta que da al despacho del **sándwich**`,
    textEn: `**Someone** was watching a door leading to the **sandwich**'s office`,
    evalFn: (st) =>
      roomDoors[vaseRoom].some((dNum) => st.doorOccupant[dNum] !== -1)
  });

  clues.push({
    id: `crime_room_doors_empty`,
    role: 'board',
    family: 'board_crime_doors',
    category: 'Umbral',
    weight: 15,
    text: `Las puertas que dan al despacho del **sándwich** estaban **desiertas**`,
    textEn: `The doors leading to the **sandwich**'s office were **deserted**`,
    evalFn: (st) =>
      roomDoors[vaseRoom].every((dNum) => st.doorOccupant[dNum] === -1)
  });

  // Relational (8)
  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;

    clues.push({
      id: `conn_any_door_${otherId}`,
      role: 'relational',
      family: 'rel_conn_door',
      targetId: otherId,
      category: 'Umbral',
      weight: 15,
      text: `Una **puerta numerada** conecta mi despacho con el de **${SUSPECTS[otherId].name}**`,
      textEn: `A **numbered door** connects my office with **${SUSPECTS[otherId].nameEn}**'s`,
      evalFn: (st) => {
        const rm1 = st.suspectRoom[speakerId];
        const rm2 = st.suspectRoom[otherId];
        return [1, 2, 3, 4].some((dNum) => {
          const [rA, rB] = doorMap[dNum];
          return (rm1 === rA && rm2 === rB) || (rm1 === rB && rm2 === rA);
        });
      }
    });

    clues.push({
      id: `more_doors_than_${otherId}`,
      role: 'relational',
      family: 'rel_door_count',
      targetId: otherId,
      category: 'Umbral',
      weight: 14,
      text: `En mi despacho hay **más puertas numeradas** que en el de **${SUSPECTS[otherId].name}**`,
      textEn: `My office has **more numbered doors** than **${SUSPECTS[otherId].nameEn}**'s`,
      evalFn: (st) =>
        roomDoors[st.suspectRoom[speakerId]].length >
        roomDoors[st.suspectRoom[otherId]].length
    });
  }

  // Paranoia (6)
  clues.push({
    id: `thief_at_some_door`,
    role: 'paranoia',
    family: 'thief_doors',
    category: 'Umbral',
    weight: 15,
    text: `El **ladrón** estaba apostado junto a una de las **4 puertas numeradas**`,
    textEn: `The **thief** was stationed next to one of the **4 numbered doors**`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return st.suspectDoors[thief].length > 0;
    }
  });

  clues.push({
    id: `thief_at_no_door`,
    role: 'paranoia',
    family: 'thief_doors',
    category: 'Umbral',
    weight: 14,
    text: `El **ladrón** evitó ponerse junto a las **puertas numeradas**`,
    textEn: `The **thief** avoided standing next to the **numbered doors**`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return st.suspectDoors[thief].length === 0;
    }
  });

  clues.push({
    id: `thief_at_even_door`,
    role: 'paranoia',
    family: 'thief_door_parity',
    category: 'Umbral',
    weight: 15,
    text: `El **ladrón** vigilaba una **puerta par (2 o 4)**`,
    textEn: `The **thief** was watching an **even door (2 or 4)**`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return st.doorOccupant[2] === thief || st.doorOccupant[4] === thief;
    }
  });

  clues.push({
    id: `thief_at_odd_door`,
    role: 'paranoia',
    family: 'thief_door_parity',
    category: 'Umbral',
    weight: 15,
    text: `El **ladrón** vigilaba una **puerta impar (1 o 3)**`,
    textEn: `The **thief** was watching an **odd door (1 or 3)**`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return st.doorOccupant[1] === thief || st.doorOccupant[3] === thief;
    }
  });

  clues.push({
    id: `thief_door_connects_me`,
    role: 'paranoia',
    family: 'thief_door_me',
    category: 'Umbral',
    weight: 15,
    text: `Una **puerta numerada** conecta mi despacho con el del **ladrón**`,
    textEn: `A **numbered door** connects my office with the **thief**'s`,
    evalFn: (st) => {
      const myRoom = st.suspectRoom[speakerId];
      return [1, 2, 3, 4].some((dNum) => {
        const [rA, rB] = doorMap[dNum];
        return (myRoom === rA && vaseRoom === rB) || (myRoom === rB && vaseRoom === rA);
      });
    }
  });

  clues.push({
    id: `thief_no_door_connects_me`,
    role: 'paranoia',
    family: 'thief_door_me',
    category: 'Umbral',
    weight: 13,
    text: `**Ninguna puerta numerada** conecta mi despacho con el del **ladrón**`,
    textEn: `**No numbered door** connects my office with the **thief**'s`,
    evalFn: (st) => {
      const myRoom = st.suspectRoom[speakerId];
      if (myRoom === vaseRoom) return false;
      return ![1, 2, 3, 4].some((dNum) => {
        const [rA, rB] = doorMap[dNum];
        return (myRoom === rA && vaseRoom === rB) || (myRoom === rB && vaseRoom === rA);
      });
    }
  });

  // ==========================================================================
  // 2. FACHADA / CARDINAL
  // ==========================================================================
  clues.push({
    id: `facade_north`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_facade_edge',
    category: 'Fachada',
    weight: 15,
    text: `Estaba ${isFem ? 'pegada' : 'pegado'} a la fachada **Norte** de la oficina`,
    textEn: `I was right against the **North** facade of the office`,
    evalFn: (st) => st.suspectRow[speakerId] === 0
  });

  clues.push({
    id: `facade_south`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_facade_edge',
    category: 'Fachada',
    weight: 15,
    text: `Me quedé junto a la fachada **Sur** de la oficina`,
    textEn: `I stayed next to the **South** facade of the office`,
    evalFn: (st) => st.suspectRow[speakerId] === 4
  });

  clues.push({
    id: `facade_west`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_facade_edge',
    category: 'Fachada',
    weight: 15,
    text: `Me encontraba junto a la fachada **Oeste** de la oficina`,
    textEn: `I was next to the **West** facade of the office`,
    evalFn: (st) => st.suspectCol[speakerId] === 0
  });

  clues.push({
    id: `facade_east`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_facade_edge',
    category: 'Fachada',
    weight: 15,
    text: `Estaba junto a la fachada **Este** de la oficina`,
    textEn: `I was next to the **East** facade of the office`,
    evalFn: (st) => st.suspectCol[speakerId] === 4
  });

  clues.push({
    id: `facade_corner`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_facade_zone',
    category: 'Fachada',
    weight: 16,
    text: `Me escaqueé en una de las **4 esquinas exteriores** de la oficina`,
    textEn: `I hid in one of the **4 outer corners** of the office`,
    evalFn: (st) =>
      (st.suspectRow[speakerId] === 0 || st.suspectRow[speakerId] === 4) &&
      (st.suspectCol[speakerId] === 0 || st.suspectCol[speakerId] === 4)
  });

  clues.push({
    id: `facade_interior`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_facade_zone',
    category: 'Fachada',
    weight: 15,
    text: `Estaba en el **interior de la oficina**, sin tocar ninguna fachada`,
    textEn: `I was in the **interior of the office**, not touching any facade`,
    evalFn: (st) =>
      st.suspectRow[speakerId] > 0 &&
      st.suspectRow[speakerId] < 4 &&
      st.suspectCol[speakerId] > 0 &&
      st.suspectCol[speakerId] < 4
  });

  clues.push({
    id: `north_half_rows`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_half_zone',
    category: 'Fachada',
    weight: 14,
    text: `Estaba ${isFem ? 'sentada' : 'sentado'} en las **2 primeras filas del Norte**`,
    textEn: `I was sitting in the **first 2 North rows**`,
    evalFn: (st) => st.suspectRow[speakerId] <= 1
  });

  clues.push({
    id: `south_half_rows`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_half_zone',
    category: 'Fachada',
    weight: 14,
    text: `Estaba ${isFem ? 'sentada' : 'sentado'} en las **2 últimas filas del Sur**`,
    textEn: `I was sitting in the **last 2 South rows**`,
    evalFn: (st) => st.suspectRow[speakerId] >= 3
  });

  clues.push({
    id: `west_half_cols`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_half_zone',
    category: 'Fachada',
    weight: 14,
    text: `Mi sitio estaba en las **2 primeras columnas del Oeste**`,
    textEn: `My spot was in the **first 2 West columns**`,
    evalFn: (st) => st.suspectCol[speakerId] <= 1
  });

  clues.push({
    id: `east_half_cols`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_half_zone',
    category: 'Fachada',
    weight: 14,
    text: `Mi sitio estaba en las **2 últimas columnas del Este**`,
    textEn: `My spot was in the **last 2 East columns**`,
    evalFn: (st) => st.suspectCol[speakerId] >= 3
  });

  clues.push({
    id: `central_axes`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_axes',
    category: 'Fachada',
    weight: 15,
    text: `Mi mesa estaba en el **pasillo central** (**fila o columna del medio**)`,
    textEn: `My desk was in the **central aisle** (**middle row or column**)`,
    evalFn: (st) => st.suspectRow[speakerId] === 2 || st.suspectCol[speakerId] === 2
  });

  clues.push({
    id: `main_diagonals`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_diagonals',
    category: 'Fachada',
    weight: 15,
    text: `Estaba ${isFem ? 'situada' : 'situado'} en una de las **dos diagonales principales** de la oficina`,
    textEn: `I was located on one of the **two main diagonals** of the office`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return r === c || r + c === 4;
    }
  });

  // Board (6)
  clues.push({
    id: `woman_on_north_south`,
    role: 'board',
    family: 'board_facade_gender',
    category: 'Fachada',
    weight: 13,
    text: `Había **una mujer** junto a la fachada **Norte o Sur**`,
    textEn: `There was **a woman** next to the **North or South** facade`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) => s.isCarnivore && (st.suspectRow[s.id] === 0 || st.suspectRow[s.id] === 4)
      )
  });

  clues.push({
    id: `woman_on_east_west`,
    role: 'board',
    family: 'board_facade_gender',
    category: 'Fachada',
    weight: 13,
    text: `Había **una mujer** junto a la fachada **Este u Oeste**`,
    textEn: `There was **a woman** next to the **East or West** facade`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) => s.isCarnivore && (st.suspectCol[s.id] === 0 || st.suspectCol[s.id] === 4)
      )
  });

  clues.push({
    id: `woman_in_interior`,
    role: 'board',
    family: 'board_facade_zone',
    category: 'Fachada',
    weight: 13,
    text: `Había **una mujer** en el **interior de la oficina**, lejos de las fachadas`,
    textEn: `There was **a woman** in the **interior of the office**, away from the facades`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) =>
          s.isCarnivore &&
          st.suspectRow[s.id] > 0 &&
          st.suspectRow[s.id] < 4 &&
          st.suspectCol[s.id] > 0 &&
          st.suspectCol[s.id] < 4
      )
  });

  clues.push({
    id: `man_in_corner`,
    role: 'board',
    family: 'board_facade_zone',
    category: 'Fachada',
    weight: 14,
    text: `Había **un hombre** en una de las **4 esquinas exteriores** de la oficina`,
    textEn: `There was **a man** in one of the **4 outer corners** of the office`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) =>
          !s.isCarnivore &&
          (st.suspectRow[s.id] === 0 || st.suspectRow[s.id] === 4) &&
          (st.suspectCol[s.id] === 0 || st.suspectCol[s.id] === 4)
      )
  });

  clues.push({
    id: `women_adj_rows`,
    role: 'board',
    family: 'women_adj',
    category: 'Fachada',
    weight: 14,
    text: isFem
      ? `Las **dos mujeres** de la oficina estábamos en **filas vecinas**`
      : `Las **dos mujeres** de la oficina estaban en **filas vecinas**`,
    textEn: `The **two women** in the office were in **adjacent rows**`,
    evalFn: (st) => {
      const women = SUSPECTS.filter((s) => s.isCarnivore).map((s) => s.id);
      return Math.abs(st.suspectRow[women[0]] - st.suspectRow[women[1]]) === 1;
    }
  });

  clues.push({
    id: `women_adj_cols`,
    role: 'board',
    family: 'women_adj',
    category: 'Fachada',
    weight: 14,
    text: isFem
      ? `Las **dos mujeres** ocupábamos **columnas vecinas**`
      : `Las **dos mujeres** ocupaban **columnas vecinas**`,
    textEn: `The **two women** occupied **adjacent columns**`,
    evalFn: (st) => {
      const women = SUSPECTS.filter((s) => s.isCarnivore).map((s) => s.id);
      return Math.abs(st.suspectCol[women[0]] - st.suspectCol[women[1]]) === 1;
    }
  });

  // Relational (8)
  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;

    clues.push({
      id: `more_north_than_${otherId}`,
      role: 'relational',
      family: 'rel_north_south',
      targetId: otherId,
      category: 'Fachada',
      weight: 14,
      text: `Yo estaba ${isFem ? 'situada' : 'situado'} más al **Norte** que **${SUSPECTS[otherId].name}**`,
      textEn: `I was located further **North** than **${SUSPECTS[otherId].nameEn}**`,
      evalFn: (st) => st.suspectRow[speakerId] < st.suspectRow[otherId]
    });

    clues.push({
      id: `more_west_than_${otherId}`,
      role: 'relational',
      family: 'rel_east_west',
      targetId: otherId,
      category: 'Fachada',
      weight: 14,
      text: `Mi sitio estaba más al **Oeste** que el de **${SUSPECTS[otherId].name}**`,
      textEn: `My spot was further **West** than **${SUSPECTS[otherId].nameEn}**'s`,
      evalFn: (st) => st.suspectCol[speakerId] < st.suspectCol[otherId]
    });
  }

  // Paranoia (6)
  clues.push({
    id: `thief_on_north_half`,
    role: 'paranoia',
    family: 'thief_facade',
    category: 'Fachada',
    weight: 15,
    text: `El **ladrón** se esconde en las **2 primeras filas del Norte**`,
    textEn: `The **thief** is hiding in the **first 2 North rows**`,
    evalFn: (st) => st.suspectRow[st.roomSuspect[vaseRoom]] <= 1
  });

  clues.push({
    id: `thief_on_south_half`,
    role: 'paranoia',
    family: 'thief_facade',
    category: 'Fachada',
    weight: 15,
    text: `El **ladrón** se esconde en las **2 últimas filas del Sur**`,
    textEn: `The **thief** is hiding in the **last 2 South rows**`,
    evalFn: (st) => st.suspectRow[st.roomSuspect[vaseRoom]] >= 3
  });

  clues.push({
    id: `thief_on_perimeter`,
    role: 'paranoia',
    family: 'thief_facade_zone',
    category: 'Fachada',
    weight: 14,
    text: `El **ladrón** estaba junto a una **fachada** de la oficina`,
    textEn: `The **thief** was next to an office **facade**`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      const r = st.suspectRow[thief];
      const c = st.suspectCol[thief];
      return r === 0 || r === 4 || c === 0 || c === 4;
    }
  });

  clues.push({
    id: `thief_in_interior`,
    role: 'paranoia',
    family: 'thief_facade_zone',
    category: 'Fachada',
    weight: 15,
    text: `El **ladrón** actuó desde el **interior de la oficina**, lejos de las fachadas`,
    textEn: `The **thief** acted from the **interior of the office**, away from the facades`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      const r = st.suspectRow[thief];
      const c = st.suspectCol[thief];
      return r > 0 && r < 4 && c > 0 && c < 4;
    }
  });

  clues.push({
    id: `thief_more_north_than_me`,
    role: 'paranoia',
    family: 'thief_rel_dir',
    category: 'Fachada',
    weight: 14,
    text: `El **ladrón** estaba en una fila más al **Norte** que la mía`,
    textEn: `The **thief** was in a row further **North** than mine`,
    evalFn: (st) => st.suspectRow[st.roomSuspect[vaseRoom]] < st.suspectRow[speakerId]
  });

  clues.push({
    id: `thief_more_south_than_me`,
    role: 'paranoia',
    family: 'thief_rel_dir',
    category: 'Fachada',
    weight: 14,
    text: `El **ladrón** estaba en una fila más al **Sur** que la mía`,
    textEn: `The **thief** was in a row further **South** than mine`,
    evalFn: (st) => st.suspectRow[st.roomSuspect[vaseRoom]] > st.suspectRow[speakerId]
  });

  // ==========================================================================
  // 3. CLAUSTROFOBIA / TAMAÑO
  // ==========================================================================
  clues.push({
    id: `self_largest_room`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_room_extreme',
    category: 'Claustrofobia',
    weight: 15,
    text:
      largestRooms.length === 1
        ? `Me instalé en el **despacho más grande** de la oficina (**${maxSize} casillas**)`
        : `Estaba en uno de los **despachos más grandes** (**${maxSize} casillas**)`,
    textEn:
      largestRooms.length === 1
        ? `I settled in the **largest office** in the building (**${maxSize} tiles**)`
        : `I was in one of the **largest offices** (**${maxSize} tiles**)`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] === maxSize
  });

  clues.push({
    id: `self_smallest_room`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_room_extreme',
    category: 'Claustrofobia',
    weight: 15,
    text:
      smallestRooms.length === 1
        ? `Me encerraron en el **despacho más pequeño** de la oficina (**${minSize} casillas**)`
        : `Estaba en uno de los **despachos más pequeños** (**${minSize} casillas**)`,
    textEn:
      smallestRooms.length === 1
        ? `They locked me in the **smallest office** in the building (**${minSize} tiles**)`
        : `I was in one of the **smallest offices** (**${minSize} tiles**)`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] === minSize
  });

  clues.push({
    id: `self_not_largest_room`,
    role: 'anchor',
    isStrongAnchor: false,
    family: 'self_room_extreme',
    category: 'Claustrofobia',
    weight: 12,
    text: `Mi despacho **no es el más grande** de la oficina`,
    textEn: `My office is **not the largest** in the building`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] < maxSize
  });

  clues.push({
    id: `self_not_smallest_room`,
    role: 'anchor',
    isStrongAnchor: false,
    family: 'self_room_extreme',
    category: 'Claustrofobia',
    weight: 12,
    text: `Mi despacho **no es el más pequeño** de la oficina`,
    textEn: `My office is **not the smallest** in the building`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] > minSize
  });

  clues.push({
    id: `self_room_size_3`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_exact_size',
    category: 'Claustrofobia',
    weight: 15,
    text: `Mi despacho mide exactamente **3 casillas**, las conté`,
    textEn: `My office measures exactly **3 tiles**, I counted them`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] === 3
  });

  clues.push({
    id: `self_room_size_4`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_exact_size',
    category: 'Claustrofobia',
    weight: 15,
    text: `Mi despacho mide exactamente **4 casillas**, las conté`,
    textEn: `My office measures exactly **4 tiles**, I counted them`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] === 4
  });

  clues.push({
    id: `self_room_size_5`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_exact_size',
    category: 'Claustrofobia',
    weight: 15,
    text: `Mi despacho mide exactamente **5 casillas**, las conté`,
    textEn: `My office measures exactly **5 tiles**, I counted them`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] === 5
  });

  clues.push({
    id: `self_room_size_6_plus`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_exact_size',
    category: 'Claustrofobia',
    weight: 15,
    text: `Mi despacho es enorme: mide **6 o más casillas**`,
    textEn: `My office is huge: it measures **6 or more tiles**`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] >= 6
  });

  clues.push({
    id: `self_room_at_least_5`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_size_threshold',
    category: 'Claustrofobia',
    weight: 13,
    text: `Mi despacho es amplio, tiene **5 o más casillas**`,
    textEn: `My office is spacious, it has **5 or more tiles**`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] >= 5
  });

  clues.push({
    id: `self_room_at_most_4`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_size_threshold',
    category: 'Claustrofobia',
    weight: 13,
    text: `Mi despacho es compacto, tiene **4 casillas o menos**`,
    textEn: `My office is compact, it has **4 tiles or fewer**`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] <= 4
  });

  clues.push({
    id: `self_room_even_size`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_size_parity',
    category: 'Claustrofobia',
    weight: 13,
    text: `Mi despacho tiene un **número par de casillas**`,
    textEn: `My office has an **even number of tiles**`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] % 2 === 0
  });

  clues.push({
    id: `self_room_odd_size`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_size_parity',
    category: 'Claustrofobia',
    weight: 13,
    text: `Mi despacho tiene un **número impar de casillas**`,
    textEn: `My office has an **odd number of tiles**`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] % 2 !== 0
  });

  // Board (6)
  clues.push({
    id: `carnivore_largest_room`,
    role: 'board',
    family: 'board_size_gender',
    category: 'Claustrofobia',
    weight: 14,
    text: `Había **una mujer** en un despacho de **${maxSize} casillas** (el tamaño máximo)`,
    textEn: `There was **a woman** in a **${maxSize}-tile** office (the maximum size)`,
    evalFn: (st) =>
      largestRooms.some((rm) => SUSPECTS[st.roomSuspect[rm]].isCarnivore)
  });

  clues.push({
    id: `herbivore_largest_room`,
    role: 'board',
    family: 'board_size_gender',
    category: 'Claustrofobia',
    weight: 13,
    text: `Había **un hombre** en un despacho de **${maxSize} casillas** (el tamaño máximo)`,
    textEn: `There was **a man** in a **${maxSize}-tile** office (the maximum size)`,
    evalFn: (st) =>
      largestRooms.some((rm) => !SUSPECTS[st.roomSuspect[rm]].isCarnivore)
  });

  clues.push({
    id: `carnivore_smallest_room`,
    role: 'board',
    family: 'board_size_gender',
    category: 'Claustrofobia',
    weight: 14,
    text: `Había **una mujer** en un despacho de **${minSize} casillas** (el tamaño mínimo)`,
    textEn: `There was **a woman** in a **${minSize}-tile** office (the minimum size)`,
    evalFn: (st) =>
      smallestRooms.some((rm) => SUSPECTS[st.roomSuspect[rm]].isCarnivore)
  });

  clues.push({
    id: `herbivore_smallest_room`,
    role: 'board',
    family: 'board_size_gender',
    category: 'Claustrofobia',
    weight: 13,
    text: `Había **un hombre** en un despacho de **${minSize} casillas** (el tamaño mínimo)`,
    textEn: `There was **a man** in a **${minSize}-tile** office (the minimum size)`,
    evalFn: (st) =>
      smallestRooms.some((rm) => !SUSPECTS[st.roomSuspect[rm]].isCarnivore)
  });

  clues.push({
    id: `women_in_even_rooms`,
    role: 'board',
    family: 'board_women_parity_size',
    category: 'Claustrofobia',
    weight: 14,
    text: `Las **dos mujeres** estaban en despachos con un **número par de casillas**`,
    textEn: `The **two women** were in offices with an **even number of tiles**`,
    evalFn: (st) =>
      SUSPECTS.filter((s) => s.isCarnivore).every(
        (s) => roomSizes[st.suspectRoom[s.id]] % 2 === 0
      )
  });

  clues.push({
    id: `women_in_odd_rooms`,
    role: 'board',
    family: 'board_women_parity_size',
    category: 'Claustrofobia',
    weight: 14,
    text: `Las **dos mujeres** estaban en despachos con un **número impar de casillas**`,
    textEn: `The **two women** were in offices with an **odd number of tiles**`,
    evalFn: (st) =>
      SUSPECTS.filter((s) => s.isCarnivore).every(
        (s) => roomSizes[st.suspectRoom[s.id]] % 2 !== 0
      )
  });

  // Relational (8)
  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;

    clues.push({
      id: `bigger_room_than_${otherId}`,
      role: 'relational',
      family: 'rel_room_size',
      targetId: otherId,
      category: 'Claustrofobia',
      weight: 14,
      text: `Mi despacho tiene **más casillas** que el de **${SUSPECTS[otherId].name}**`,
      textEn: `My office has **more tiles** than **${SUSPECTS[otherId].nameEn}**'s`,
      evalFn: (st) =>
        roomSizes[st.suspectRoom[speakerId]] > roomSizes[st.suspectRoom[otherId]]
    });

    clues.push({
      id: `same_room_size_as_${otherId}`,
      role: 'relational',
      family: 'rel_room_same_size',
      targetId: otherId,
      category: 'Claustrofobia',
      weight: 15,
      text: `Mi despacho mide **las mismas casillas** que el de **${SUSPECTS[otherId].name}**`,
      textEn: `My office has **the same number of tiles** as **${SUSPECTS[otherId].nameEn}**'s`,
      evalFn: (st) =>
        roomSizes[st.suspectRoom[speakerId]] === roomSizes[st.suspectRoom[otherId]]
    });
  }

  // Paranoia (6)
  clues.push({
    id: `my_room_bigger_than_thief`,
    role: 'paranoia',
    family: 'thief_rel_room_size',
    category: 'Claustrofobia',
    weight: 14,
    text: `Mi despacho tiene **más casillas** que el despacho del **ladrón**`,
    textEn: `My office has **more tiles** than the **thief**'s office`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] > roomSizes[vaseRoom]
  });

  clues.push({
    id: `my_room_smaller_than_thief`,
    role: 'paranoia',
    family: 'thief_rel_room_size',
    category: 'Claustrofobia',
    weight: 14,
    text: `Mi despacho tiene **menos casillas** que el despacho del **ladrón**`,
    textEn: `My office has **fewer tiles** than the **thief**'s office`,
    evalFn: (st) => roomSizes[st.suspectRoom[speakerId]] < roomSizes[vaseRoom]
  });

  clues.push({
    id: `my_room_same_size_thief`,
    role: 'paranoia',
    family: 'thief_rel_room_size',
    category: 'Claustrofobia',
    weight: 15,
    text: `Mi despacho mide **las mismas casillas** que el despacho del **ladrón**`,
    textEn: `My office has **the same number of tiles** as the **thief**'s office`,
    evalFn: (st) =>
      st.suspectRoom[speakerId] !== vaseRoom &&
      roomSizes[st.suspectRoom[speakerId]] === roomSizes[vaseRoom]
  });

  clues.push({
    id: `thief_touches_larger_room`,
    role: 'paranoia',
    family: 'thief_cell_touch_size',
    category: 'Claustrofobia',
    weight: 15,
    text: `Desde su casilla, el **ladrón** tocaba el tabique de un despacho **más grande** que el suyo`,
    textEn: `From their tile, the **thief** touched the wall of an office **larger** than their own`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      const walls = cellTouchesRoomWall[st.suspectRow[thief]][st.suspectCol[thief]];
      return Array.from(walls).some((rm) => roomSizes[rm] > roomSizes[vaseRoom]);
    }
  });

  clues.push({
    id: `thief_touches_smaller_room`,
    role: 'paranoia',
    family: 'thief_cell_touch_size',
    category: 'Claustrofobia',
    weight: 15,
    text: `Desde su casilla, el **ladrón** tocaba el tabique de un despacho **más pequeño** que el suyo`,
    textEn: `From their tile, the **thief** touched the wall of an office **smaller** than their own`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      const walls = cellTouchesRoomWall[st.suspectRow[thief]][st.suspectCol[thief]];
      return Array.from(walls).some((rm) => roomSizes[rm] < roomSizes[vaseRoom]);
    }
  });

  clues.push({
    id: `thief_touches_smallest_room`,
    role: 'paranoia',
    family: 'thief_cell_touch_size',
    category: 'Claustrofobia',
    weight: 15,
    text: `La casilla del **ladrón** tocaba el tabique de un despacho de **${minSize} casillas**`,
    textEn: `The **thief**'s tile touched the wall of a **${minSize}-tile** office`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      const walls = cellTouchesRoomWall[st.suspectRow[thief]][st.suspectCol[thief]];
      return Array.from(walls).some((rm) => roomSizes[rm] === minSize);
    }
  });

  // ==========================================================================
  // 4. ESCENARIO / TABIQUES
  // ==========================================================================
  clues.push({
    id: `touch_many_rooms`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_wall_count',
    category: 'Escenario',
    weight: 15,
    text: `Desde mi casilla tocaba los tabiques de **al menos 2 despachos ajenos**`,
    textEn: `From my tile I touched the walls of **at least 2 other offices**`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return cellTouchesRoomWall[r][c].size >= 2;
    }
  });

  clues.push({
    id: `touch_exactly_one_room`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_wall_count',
    category: 'Escenario',
    weight: 14,
    text: `Desde mi casilla tocaba el tabique de **exactamente 1 despacho ajeno**`,
    textEn: `From my tile I touched the wall of **exactly 1 other office**`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return cellTouchesRoomWall[r][c].size === 1;
    }
  });

  clues.push({
    id: `deep_inside_room`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_wall_count',
    category: 'Escenario',
    weight: 15,
    text: `En mi casilla estaba ${isFem ? 'aislada' : 'aislado'}: **no tocaba el tabique** de ningún otro despacho`,
    textEn: `In my tile I was isolated: **I didn't touch the wall** of any other office`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return cellTouchesRoomWall[r][c].size === 0;
    }
  });

  clues.push({
    id: `touch_crime_room_wall`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_touch_crime_wall',
    category: 'Escenario',
    weight: 15,
    text: `Estaba fuera del despacho del **sándwich**, pero **tocando su tabique**`,
    textEn: `I was outside the **sandwich**'s office, but **touching its wall**`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return cellTouchesRoomWall[r][c].has(vaseRoom);
    }
  });

  clues.push({
    id: `no_touch_crime_room_wall`,
    role: 'anchor',
    isStrongAnchor: false,
    family: 'self_touch_crime_wall',
    category: 'Escenario',
    weight: 12,
    text: `Estaba fuera del despacho del **sándwich** y **sin tocar su tabique**`,
    textEn: `I was outside the **sandwich**'s office and **not touching its wall**`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return st.suspectRoom[speakerId] !== vaseRoom && !cellTouchesRoomWall[r][c].has(vaseRoom);
    }
  });

  clues.push({
    id: `touch_largest_room_wall`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_touch_extreme_wall',
    category: 'Escenario',
    weight: 14,
    text: `Desde mi casilla tocaba el tabique de un despacho de **${maxSize} casillas**`,
    textEn: `From my tile I touched the wall of a **${maxSize}-tile** office`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return Array.from(cellTouchesRoomWall[r][c]).some((rm) => roomSizes[rm] === maxSize);
    }
  });

  clues.push({
    id: `touch_smallest_room_wall`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_touch_extreme_wall',
    category: 'Escenario',
    weight: 14,
    text: `Desde mi casilla tocaba el tabique de un despacho de **${minSize} casillas**`,
    textEn: `From my tile I touched the wall of a **${minSize}-tile** office`,
    evalFn: (st) => {
      const r = st.suspectRow[speakerId];
      const c = st.suspectCol[speakerId];
      return Array.from(cellTouchesRoomWall[r][c]).some((rm) => roomSizes[rm] === minSize);
    }
  });

  for (let rm = 0; rm < 5; rm++) {
    const rmName = ROOMS[rm].name.toLowerCase();
    const rmNameEn = ROOMS[rm].nameEn.toLowerCase();
    clues.push({
      id: `touch_wall_of_room_${rm}`,
      role: 'anchor',
      isStrongAnchor: true,
      family: 'self_touch_color_wall',
      category: 'Escenario',
      weight: 15,
      text: `Estaba fuera del **despacho ${rmName}**, **tocando su tabique**`,
      textEn: `I was outside the **${rmNameEn} office**, **touching its wall**`,
      evalFn: (st) => {
        const r = st.suspectRow[speakerId];
        const c = st.suspectCol[speakerId];
        return cellTouchesRoomWall[r][c].has(rm);
      }
    });
  }

  // Board (6)
  clues.push({
    id: `woman_touches_many_rooms`,
    role: 'board',
    family: 'board_walls_gender',
    category: 'Escenario',
    weight: 14,
    text: `Había **una mujer** cuya casilla tocaba los tabiques de **al menos 2 despachos ajenos**`,
    textEn: `There was **a woman** whose tile touched the walls of **at least 2 other offices**`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) =>
          s.isCarnivore &&
          cellTouchesRoomWall[st.suspectRow[s.id]][st.suspectCol[s.id]].size >= 2
      )
  });

  clues.push({
    id: `man_touches_many_rooms`,
    role: 'board',
    family: 'board_walls_gender',
    category: 'Escenario',
    weight: 14,
    text: `Había **un hombre** cuya casilla tocaba los tabiques de **al menos 2 despachos ajenos**`,
    textEn: `There was **a man** whose tile touched the walls of **at least 2 other offices**`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) =>
          !s.isCarnivore &&
          cellTouchesRoomWall[st.suspectRow[s.id]][st.suspectCol[s.id]].size >= 2
      )
  });

  clues.push({
    id: `someone_deep_inside`,
    role: 'board',
    family: 'board_walls_isolation',
    category: 'Escenario',
    weight: 14,
    text: `Había **alguien** en su despacho que **no tocaba tabiques** de otros despachos`,
    textEn: `There was **someone** in their office who **didn't touch walls** of other offices`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) => cellTouchesRoomWall[st.suspectRow[s.id]][st.suspectCol[s.id]].size === 0
      )
  });

  clues.push({
    id: `nobody_deep_inside`,
    role: 'board',
    family: 'board_walls_isolation',
    category: 'Escenario',
    weight: 14,
    text: `**Todos** tocábamos desde nuestra casilla el tabique de **al menos 1 despacho ajeno**`,
    textEn: `**Everyone** touched the wall of **at least 1 other office** from their tile`,
    evalFn: (st) =>
      SUSPECTS.every(
        (s) => cellTouchesRoomWall[st.suspectRow[s.id]][st.suspectCol[s.id]].size >= 1
      )
  });

  clues.push({
    id: `someone_touches_crime_wall`,
    role: 'board',
    family: 'board_crime_wall',
    category: 'Escenario',
    weight: 14,
    text: `Había **alguien** desde fuera tocando el tabique del despacho del **sándwich**`,
    textEn: `**Someone** outside was touching the wall of the **sandwich**'s office`,
    evalFn: (st) =>
      SUSPECTS.some((s) =>
        cellTouchesRoomWall[st.suspectRow[s.id]][st.suspectCol[s.id]].has(vaseRoom)
      )
  });

  clues.push({
    id: `nobody_touches_crime_wall`,
    role: 'board',
    family: 'board_crime_wall',
    category: 'Escenario',
    weight: 15,
    text: `**Nadie** de los otros despachos tocaba el tabique del despacho del **sándwich**`,
    textEn: `**Nobody** from the other offices touched the wall of the **sandwich**'s office`,
    evalFn: (st) =>
      !SUSPECTS.some((s) =>
        cellTouchesRoomWall[st.suspectRow[s.id]][st.suspectCol[s.id]].has(vaseRoom)
      )
  });

  // Relational (8)
  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;

    clues.push({
      id: `touch_suspect_room_wall_${otherId}`,
      role: 'relational',
      family: 'rel_touch_wall',
      targetId: otherId,
      category: 'Escenario',
      weight: 15,
      text: `Desde mi sitio tocaba el tabique del despacho de **${SUSPECTS[otherId].name}**`,
      textEn: `From my spot I touched the wall of **${SUSPECTS[otherId].nameEn}**'s office`,
      evalFn: (st) => {
        const r = st.suspectRow[speakerId];
        const c = st.suspectCol[speakerId];
        return cellTouchesRoomWall[r][c].has(st.suspectRoom[otherId]);
      }
    });

    clues.push({
      id: `other_touches_my_room_wall_${otherId}`,
      role: 'relational',
      family: 'rel_touch_wall',
      targetId: otherId,
      category: 'Escenario',
      weight: 15,
      text: `La casilla de **${SUSPECTS[otherId].name}** tocaba el tabique de **mi despacho**`,
      textEn: `**${SUSPECTS[otherId].nameEn}**'s tile touched the wall of **my office**`,
      evalFn: (st) => {
        const or = st.suspectRow[otherId];
        const oc = st.suspectCol[otherId];
        return cellTouchesRoomWall[or][oc].has(st.suspectRoom[speakerId]);
      }
    });
  }

  // Paranoia (6)
  clues.push({
    id: `thief_touches_many_rooms`,
    role: 'paranoia',
    family: 'thief_walls',
    category: 'Escenario',
    weight: 15,
    text: `El **ladrón** tocaba desde su sitio los tabiques de **al menos 2 despachos ajenos**`,
    textEn: `The **thief** touched the walls of **at least 2 other offices** from their spot`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return cellTouchesRoomWall[st.suspectRow[thief]][st.suspectCol[thief]].size >= 2;
    }
  });

  clues.push({
    id: `thief_touches_at_most_one`,
    role: 'paranoia',
    family: 'thief_walls',
    category: 'Escenario',
    weight: 14,
    text: `El **ladrón** tocaba como mucho **1 tabique** de otro despacho desde su casilla`,
    textEn: `The **thief** touched at most **1 wall** of another office from their tile`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return cellTouchesRoomWall[st.suspectRow[thief]][st.suspectCol[thief]].size <= 1;
    }
  });

  clues.push({
    id: `thief_deep_inside`,
    role: 'paranoia',
    family: 'thief_walls_isolation',
    category: 'Escenario',
    weight: 15,
    text: `El **ladrón** estaba en el interior de su despacho, **sin tocar tabiques ajenos**`,
    textEn: `The **thief** was deep inside their office, **not touching other walls**`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return cellTouchesRoomWall[st.suspectRow[thief]][st.suspectCol[thief]].size === 0;
    }
  });

  clues.push({
    id: `thief_touches_some_wall`,
    role: 'paranoia',
    family: 'thief_walls_isolation',
    category: 'Escenario',
    weight: 14,
    text: `La casilla del **ladrón** estaba pegada al **tabique de otro despacho**`,
    textEn: `The **thief**'s tile was right against the **wall of another office**`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return cellTouchesRoomWall[st.suspectRow[thief]][st.suspectCol[thief]].size >= 1;
    }
  });

  clues.push({
    id: `thief_touches_my_room`,
    role: 'paranoia',
    family: 'thief_walls_me',
    category: 'Escenario',
    weight: 15,
    text: `La casilla del **ladrón** tocaba directamente el tabique de **mi despacho**`,
    textEn: `The **thief**'s tile directly touched the wall of **my office**`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return cellTouchesRoomWall[st.suspectRow[thief]][st.suspectCol[thief]].has(
        st.suspectRoom[speakerId]
      );
    }
  });

  clues.push({
    id: `thief_not_touching_my_room`,
    role: 'paranoia',
    family: 'thief_walls_me',
    category: 'Escenario',
    weight: 14,
    text: `Desde su casilla, el **ladrón** **no tocaba el tabique** de mi despacho`,
    textEn: `From their tile, the **thief** **didn't touch the wall** of my office`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return !cellTouchesRoomWall[st.suspectRow[thief]][st.suspectCol[thief]].has(
        st.suspectRoom[speakerId]
      );
    }
  });

  // ==========================================================================
  // 5. SANDWICH / CRIMEN
  // ==========================================================================
  clues.push({
    id: `adj_to_vase_orth`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_touch',
    category: 'Sandwich',
    weight: 16,
    text: `Mi casilla tocaba por un **lado** (no en diagonal) al **sándwich**`,
    textEn: `My tile touched the **sandwich** by a **side** (not diagonally)`,
    evalFn: (st) =>
      Math.abs(st.suspectRow[speakerId] - vasePos.r) +
        Math.abs(st.suspectCol[speakerId] - vasePos.c) ===
      1
  });

  clues.push({
    id: `adj_to_vase_diag`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_touch',
    category: 'Sandwich',
    weight: 16,
    text: `Mi casilla tocaba **en diagonal** la casilla del **sándwich**`,
    textEn: `My tile touched the **sandwich**'s tile **diagonally**`,
    evalFn: (st) =>
      Math.abs(st.suspectRow[speakerId] - vasePos.r) === 1 &&
      Math.abs(st.suspectCol[speakerId] - vasePos.c) === 1
  });

  clues.push({
    id: `adj_to_vase_king`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_touch',
    category: 'Sandwich',
    weight: 15,
    text: `Estaba en una casilla que **rodea** al **sándwich** (por lado o diagonal)`,
    textEn: `I was on a tile **surrounding** the **sandwich** (by side or diagonally)`,
    evalFn: (st) =>
      Math.abs(st.suspectRow[speakerId] - vasePos.r) <= 1 &&
      Math.abs(st.suspectCol[speakerId] - vasePos.c) <= 1
  });

  clues.push({
    id: `same_row_as_vase`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_line',
    category: 'Sandwich',
    weight: 16,
    text: `Estaba en la **misma fila horizontal** que el **sándwich**`,
    textEn: `I was in the **same horizontal row** as the **sandwich**`,
    evalFn: (st) => st.suspectRow[speakerId] === vasePos.r
  });

  clues.push({
    id: `same_col_as_vase`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_line',
    category: 'Sandwich',
    weight: 16,
    text: `Estaba en la **misma columna vertical** que el **sándwich**`,
    textEn: `I was in the **same vertical column** as the **sandwich**`,
    evalFn: (st) => st.suspectCol[speakerId] === vasePos.c
  });

  clues.push({
    id: `knight_to_vase`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_knight',
    category: 'Sandwich',
    weight: 16,
    text: `Mi casilla y la del **sándwich** estaban a un **salto de L**`,
    textEn: `My tile and the **sandwich**'s were an **L-jump** apart`,
    evalFn: (st) =>
      Math.abs(st.suspectRow[speakerId] - vasePos.r) *
        Math.abs(st.suspectCol[speakerId] - vasePos.c) ===
      2
  });

  clues.push({
    id: `adj_row_to_vase`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_adj_axis',
    category: 'Sandwich',
    weight: 15,
    text: `Mi fila era **vecina** (arriba o abajo) a la fila del **sándwich**`,
    textEn: `My row was **adjacent** (above or below) to the **sandwich**'s row`,
    evalFn: (st) => Math.abs(st.suspectRow[speakerId] - vasePos.r) === 1
  });

  clues.push({
    id: `adj_col_to_vase`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_adj_axis',
    category: 'Sandwich',
    weight: 15,
    text: `Mi columna era **vecina** (izquierda o derecha) a la del **sándwich**`,
    textEn: `My column was **adjacent** (left or right) to the **sandwich**'s`,
    evalFn: (st) => Math.abs(st.suspectCol[speakerId] - vasePos.c) === 1
  });

  clues.push({
    id: `more_north_than_vase`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_dir',
    category: 'Sandwich',
    weight: 14,
    text: `Estaba en una fila más al **Norte** que la del **sándwich**`,
    textEn: `I was in a row further **North** than the **sandwich**'s`,
    evalFn: (st) => st.suspectRow[speakerId] < vasePos.r
  });

  clues.push({
    id: `more_south_than_vase`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_dir',
    category: 'Sandwich',
    weight: 14,
    text: `Estaba en una fila más al **Sur** que la del **sándwich**`,
    textEn: `I was in a row further **South** than the **sandwich**'s`,
    evalFn: (st) => st.suspectRow[speakerId] > vasePos.r
  });

  clues.push({
    id: `more_west_than_vase`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_dir',
    category: 'Sandwich',
    weight: 14,
    text: `Estaba en una columna más al **Oeste** que la del **sándwich**`,
    textEn: `I was in a column further **West** than the **sandwich**'s`,
    evalFn: (st) => st.suspectCol[speakerId] < vasePos.c
  });

  clues.push({
    id: `more_east_than_vase`,
    role: 'anchor',
    isStrongAnchor: true,
    family: 'self_vase_dir',
    category: 'Sandwich',
    weight: 14,
    text: `Estaba en una columna más al **Este** que la del **sándwich**`,
    textEn: `I was in a column further **East** than the **sandwich**'s`,
    evalFn: (st) => st.suspectCol[speakerId] > vasePos.c
  });

  // Board (6)
  clues.push({
    id: `carnivore_same_line_vase`,
    role: 'board',
    family: 'board_vase_line',
    category: 'Sandwich',
    weight: 14,
    text: `Había **una mujer** en la **misma fila o columna** que el **sándwich**`,
    textEn: `There was **a woman** in the **same row or column** as the **sandwich**`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) =>
          s.isCarnivore &&
          (st.suspectRow[s.id] === vasePos.r || st.suspectCol[s.id] === vasePos.c)
      )
  });

  clues.push({
    id: `herbivore_same_line_vase`,
    role: 'board',
    family: 'board_vase_line',
    category: 'Sandwich',
    weight: 13,
    text: `Había **un hombre** en la **misma fila o columna** que el **sándwich**`,
    textEn: `There was **a man** in the **same row or column** as the **sandwich**`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) =>
          !s.isCarnivore &&
          (st.suspectRow[s.id] === vasePos.r || st.suspectCol[s.id] === vasePos.c)
      )
  });

  clues.push({
    id: `someone_surrounding_vase`,
    role: 'board',
    family: 'board_vase_ring',
    category: 'Sandwich',
    weight: 14,
    text: `Había **alguien** en las casillas que **rodean** al **sándwich** (lado o diagonal)`,
    textEn: `There was **someone** on the tiles **surrounding** the **sandwich** (side or diagonal)`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) =>
          Math.abs(st.suspectRow[s.id] - vasePos.r) <= 1 &&
          Math.abs(st.suspectCol[s.id] - vasePos.c) <= 1
      )
  });

  clues.push({
    id: `nobody_surrounding_vase`,
    role: 'board',
    family: 'board_vase_ring',
    category: 'Sandwich',
    weight: 15,
    text: `No había **nadie** en las casillas que **rodean** al **sándwich** (lado o diagonal)`,
    textEn: `There was **nobody** on the tiles **surrounding** the **sandwich** (side or diagonal)`,
    evalFn: (st) =>
      !SUSPECTS.some(
        (s) =>
          Math.abs(st.suspectRow[s.id] - vasePos.r) <= 1 &&
          Math.abs(st.suspectCol[s.id] - vasePos.c) <= 1
      )
  });

  clues.push({
    id: `woman_surrounding_vase`,
    role: 'board',
    family: 'board_vase_ring_gender',
    category: 'Sandwich',
    weight: 14,
    text: `Había **una mujer** en una de las casillas que **rodean** al **sándwich**`,
    textEn: `There was **a woman** on one of the tiles **surrounding** the **sandwich**`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) =>
          s.isCarnivore &&
          Math.abs(st.suspectRow[s.id] - vasePos.r) <= 1 &&
          Math.abs(st.suspectCol[s.id] - vasePos.c) <= 1
      )
  });

  clues.push({
    id: `man_surrounding_vase`,
    role: 'board',
    family: 'board_vase_ring_gender',
    category: 'Sandwich',
    weight: 14,
    text: `Había **un hombre** en una de las casillas que **rodean** al **sándwich**`,
    textEn: `There was **a man** on one of the tiles **surrounding** the **sandwich**`,
    evalFn: (st) =>
      SUSPECTS.some(
        (s) =>
          !s.isCarnivore &&
          Math.abs(st.suspectRow[s.id] - vasePos.r) <= 1 &&
          Math.abs(st.suspectCol[s.id] - vasePos.c) <= 1
      )
  });

  // Relational (16)
  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;

    clues.push({
      id: `vase_between_rows_${otherId}`,
      role: 'relational',
      family: 'rel_vase_between',
      targetId: otherId,
      category: 'Sandwich',
      weight: 16,
      text: `La fila del **sándwich** quedaba **entre** mi fila y la de **${SUSPECTS[otherId].name}**`,
      textEn: `The **sandwich**'s row was **between** my row and **${SUSPECTS[otherId].nameEn}**'s`,
      evalFn: (st) =>
        (st.suspectRow[speakerId] < vasePos.r && vasePos.r < st.suspectRow[otherId]) ||
        (st.suspectRow[otherId] < vasePos.r && vasePos.r < st.suspectRow[speakerId])
    });

    clues.push({
      id: `vase_between_cols_${otherId}`,
      role: 'relational',
      family: 'rel_vase_between',
      targetId: otherId,
      category: 'Sandwich',
      weight: 16,
      text: `La columna del **sándwich** quedaba **entre** mi columna y la de **${SUSPECTS[otherId].name}**`,
      textEn: `The **sandwich**'s column was **between** my column and **${SUSPECTS[otherId].nameEn}**'s`,
      evalFn: (st) =>
        (st.suspectCol[speakerId] < vasePos.c && vasePos.c < st.suspectCol[otherId]) ||
        (st.suspectCol[otherId] < vasePos.c && vasePos.c < st.suspectCol[speakerId])
    });

    clues.push({
      id: `closer_row_to_vase_${otherId}`,
      role: 'relational',
      family: 'rel_vase_row_dist',
      targetId: otherId,
      category: 'Sandwich',
      weight: 14,
      text: `Mi fila estaba **más próxima en vertical** al **sándwich** que la de **${SUSPECTS[otherId].name}**`,
      textEn: `My row was **closer vertically** to the **sandwich** than **${SUSPECTS[otherId].nameEn}**'s`,
      evalFn: (st) =>
        Math.abs(st.suspectRow[speakerId] - vasePos.r) <
        Math.abs(st.suspectRow[otherId] - vasePos.r)
    });

    clues.push({
      id: `closer_col_to_vase_${otherId}`,
      role: 'relational',
      family: 'rel_vase_col_dist',
      targetId: otherId,
      category: 'Sandwich',
      weight: 14,
      text: `Mi columna estaba **más próxima en horizontal** al **sándwich** que la de **${SUSPECTS[otherId].name}**`,
      textEn: `My column was **closer horizontally** to the **sandwich** than **${SUSPECTS[otherId].nameEn}**'s`,
      evalFn: (st) =>
        Math.abs(st.suspectCol[speakerId] - vasePos.c) <
        Math.abs(st.suspectCol[otherId] - vasePos.c)
    });

    clues.push({
      id: `accuse_${otherId}`,
      role: 'paranoia',
      family: 'paranoia_accuse',
      targetId: otherId,
      category: 'Sandwich',
      weight: 15,
      text: `¡**${SUSPECTS[otherId].name}** **miente**, tiene migas de **sándwich**!`,
      textEn: `**${SUSPECTS[otherId].nameEn}** **is lying**, they have **sandwich** crumbs!`,
      evalFn: (st) => st.suspectRoom[otherId] === vaseRoom
    });
  }

  clues.push({
    id: `thief_surrounding_vase`,
    role: 'paranoia',
    family: 'thief_vase_ring',
    category: 'Sandwich',
    weight: 15,
    text: `El **ladrón** estaba en una casilla que **rodea** al **sándwich** (lado o diagonal)`,
    textEn: `The **thief** was on a tile **surrounding** the **sandwich** (side or diagonal)`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return (
        Math.abs(st.suspectRow[thief] - vasePos.r) <= 1 &&
        Math.abs(st.suspectCol[thief] - vasePos.c) <= 1
      );
    }
  });

  clues.push({
    id: `thief_same_line_vase`,
    role: 'paranoia',
    family: 'thief_vase_line',
    category: 'Sandwich',
    weight: 15,
    text: `El **ladrón** compartía **fila o columna** con la casilla del **sándwich**`,
    textEn: `The **thief** shared a **row or column** with the **sandwich**'s tile`,
    evalFn: (st) => {
      const thief = st.roomSuspect[vaseRoom];
      return (
        st.suspectRow[thief] === vasePos.r || st.suspectCol[thief] === vasePos.c
      );
    }
  });

  // ==========================================================================
  // 6. DESPACHO / GÉNERO
  // ==========================================================================
  for (let rm = 0; rm < 5; rm++) {
    const rmName = ROOMS[rm].name.toLowerCase();
    const rmNameEn = ROOMS[rm].nameEn.toLowerCase();

    clues.push({
      id: `self_in_room_${rm}`,
      role: 'anchor',
      isStrongAnchor: true,
      family: 'self_in_room_color',
      category: 'Despacho',
      weight: 13,
      text: `Yo estaba trabajando tranquilamente en el **despacho ${rmName}**`,
      textEn: `I was working quietly in the **${rmNameEn} office**`,
      evalFn: (st) => st.suspectRoom[speakerId] === rm
    });

    clues.push({
      id: `self_not_in_room_${rm}`,
      role: 'anchor',
      isStrongAnchor: false,
      family: `self_not_room_${rm}`,
      category: 'Despacho',
      weight: 12,
      text: `Yo **no pisé** el **despacho ${rmName}** en toda la mañana`,
      textEn: `I **didn't step into** the **${rmNameEn} office** all morning`,
      evalFn: (st) => st.suspectRoom[speakerId] !== rm
    });

    clues.push({
      id: `carnivore_in_room_${rm}`,
      role: 'board',
      family: `room_gender_${rm}`,
      category: 'Despacho',
      weight: 13,
      text: `El **despacho ${rmName}** lo ocupaba **una mujer**`,
      textEn: `The **${rmNameEn} office** was occupied by **a woman**`,
      evalFn: (st) => SUSPECTS[st.roomSuspect[rm]].isCarnivore
    });

    clues.push({
      id: `herbivore_in_room_${rm}`,
      role: 'board',
      family: `room_gender_${rm}`,
      category: 'Despacho',
      weight: 12,
      text: `El **despacho ${rmName}** lo ocupaba **un hombre**`,
      textEn: `The **${rmNameEn} office** was occupied by **a man**`,
      evalFn: (st) => !SUSPECTS[st.roomSuspect[rm]].isCarnivore
    });
  }

  for (let otherId = 0; otherId < 5; otherId++) {
    if (otherId === speakerId) continue;

    clues.push({
      id: `knight_move_with_${otherId}`,
      role: 'relational',
      family: 'rel_knight_move',
      targetId: otherId,
      category: 'Despacho',
      weight: 16,
      text: `Mi casilla y la de **${SUSPECTS[otherId].name}** estaban a **salto de caballo (en L)**`,
      textEn: `My tile and **${SUSPECTS[otherId].nameEn}**'s were a **knight's move (L-jump)** apart`,
      evalFn: (st) =>
        Math.abs(st.suspectRow[speakerId] - st.suspectRow[otherId]) *
          Math.abs(st.suspectCol[speakerId] - st.suspectCol[otherId]) ===
        2
    });

    clues.push({
      id: `both_cool_rooms_${otherId}`,
      role: 'relational',
      family: 'rel_room_palette',
      targetId: otherId,
      category: 'Despacho',
      weight: 15,
      text: `Tanto **${SUSPECTS[otherId].name}** como yo estábamos en despachos fríos (**azul**, **verde** o **morado**)`,
      textEn: `Both **${SUSPECTS[otherId].nameEn}** and I were in cool offices (**blue**, **green** or **purple**)`,
      evalFn: (st) => {
        const cool = [0, 2, 4];
        return (
          cool.includes(st.suspectRoom[speakerId]) &&
          cool.includes(st.suspectRoom[otherId])
        );
      }
    });

    clues.push({
      id: `both_warm_rooms_${otherId}`,
      role: 'relational',
      family: 'rel_room_palette',
      targetId: otherId,
      category: 'Despacho',
      weight: 15,
      text: `Tanto **${SUSPECTS[otherId].name}** como yo estábamos en despachos cálidos (**rojo** o **amarillo**)`,
      textEn: `Both **${SUSPECTS[otherId].nameEn}** and I were in warm offices (**red** or **yellow**)`,
      evalFn: (st) => {
        const warm = [1, 3];
        return (
          warm.includes(st.suspectRoom[speakerId]) &&
          warm.includes(st.suspectRoom[otherId])
        );
      }
    });

    clues.push({
      id: `vouch_${otherId}`,
      role: 'paranoia',
      family: 'paranoia_vouch',
      targetId: otherId,
      category: 'Despacho',
      weight: 13,
      text: `Pongo la mano en el fuego por **${SUSPECTS[otherId].name}**: **dice la verdad**`,
      textEn: `I vouch for **${SUSPECTS[otherId].nameEn}**: **they are telling the truth**`,
      evalFn: (st) => st.suspectRoom[otherId] !== vaseRoom
    });
  }

  clues.push({
    id: `thief_is_carnivore`,
    role: 'paranoia',
    family: 'thief_gender',
    category: 'Despacho',
    weight: 15,
    text: `El **ladrón** del almuerzo es **una mujer**, la vi abrir el tupper`,
    textEn: `The lunch **thief** is **a woman**, I saw her open the lunchbox`,
    evalFn: (st) => SUSPECTS[st.roomSuspect[vaseRoom]].isCarnivore
  });

  clues.push({
    id: `thief_is_herbivore`,
    role: 'paranoia',
    family: 'thief_gender',
    category: 'Despacho',
    weight: 14,
    text: `Quien se zampó el **sándwich** es **un hombre**`,
    textEn: `Whoever ate the **sandwich** is **a man**`,
    evalFn: (st) => !SUSPECTS[st.roomSuspect[vaseRoom]].isCarnivore
  });

  return clues;
}
