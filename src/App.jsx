import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Share2,
  Check,
  Shuffle,
  Clock,
  Menu,
  Trophy,
  RotateCcw
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

import {
  ROOMS,
  ROOM_TEXT_STYLES,
  SUSPECTS,
  sandwichSvg
} from './constants/gameData';
import {
  supabase,
  sanitizeText,
  cleanStatementText,
  formatTime
} from './lib/supabase';
import {
  getDailyConfig,
  getTimeUntilMidnight,
  getSeedFromUrl,
  getSavedLevelState,
  buildStateObject,
  generateCompleteLevel
} from './engine/levelGenerator';

import HelpModal from './components/HelpModal';
import MenuModal from './components/MenuModal';
import ShareModal from './components/ShareModal';

function renderFormattedClue(text, isDark) {
  if (!text) return null;
  const cleaned = cleanStatementText(text);
  const parts = cleaned.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2).replace(/[\.…]+$/g, '');
      const lower = content.toLowerCase();

      const matchedSuspect = SUSPECTS.find(
        (s) => s.name.toLowerCase() === lower
      );

      if (matchedSuspect) {
        return (
          <strong
            key={idx}
            className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}
          >
            {content}{' '}
            <span className="whitespace-nowrap font-normal">
              (
              <img
                src={matchedSuspect.emoji}
                alt={matchedSuspect.name}
                className="w-3.5 h-3.5 object-contain inline-block align-middle -translate-y-[1.5px] mx-0.5"
              />
              )
            </span>
          </strong>
        );
      }

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
            className={`font-bold ${isDark ? 'text-white' : 'text-neutral-950'}`}
          >
            {content}{' '}
            <span className="whitespace-nowrap font-normal">
              (
              <img
                src={sandwichSvg}
                alt="sándwich"
                className="w-3.5 h-3.5 object-contain inline-block align-middle -translate-y-[1.5px] mx-0.5"
              />
              )
            </span>
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

export default function App() {
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sandwich_theme_mode');
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          return saved;
        }
      } catch (_e) {
        // Ignorar
      }
    }
    return 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemIsDark(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('sandwich_theme_mode', themeMode);
    } catch (_e) {
      // Ignorar
    }
  }, [themeMode]);

  const isDark = themeMode === 'system' ? systemIsDark : themeMode === 'dark';

  const dailyConfig = useMemo(() => getDailyConfig(), []);
  const yesterdayConfig = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getDailyConfig(yesterday);
  }, []);

  const dailyStorageKey = `sandwich_daily_state_${dailyConfig.seed}`;

  const initialSession = useMemo(() => {
    const urlSeed = getSeedFromUrl();
    if (urlSeed !== null) {
      return { isDaily: false, randomSeed: urlSeed };
    }
    if (typeof window !== 'undefined') {
      try {
        const rawSession = localStorage.getItem('sandwich_active_session');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (
            parsed &&
            parsed.isDaily === false &&
            typeof parsed.seed === 'number' &&
            parsed.seed > 0
          ) {
            return { isDaily: false, randomSeed: parsed.seed };
          }
        }
      } catch (_e) {
        // Ignorar
      }
    }
    return { isDaily: true, randomSeed: null };
  }, []);

  const [isDailyMode, setIsDailyMode] = useState(() => initialSession.isDaily);

  const [level, setLevel] = useState(() => {
    if (!initialSession.isDaily && initialSession.randomSeed !== null) {
      const randomLvl = generateCompleteLevel(null, initialSession.randomSeed, false);
      if (randomLvl) return randomLvl;
    }
    return generateCompleteLevel(dailyConfig.categories, dailyConfig.seed, true);
  });

  const activeStorageKey = useMemo(() => {
    if (isDailyMode) return dailyStorageKey;
    return level?.seed ? `sandwich_random_state_${level.seed}` : null;
  }, [isDailyMode, dailyStorageKey, level?.seed]);

  const initialSavedState = useMemo(
    () => getSavedLevelState(activeStorageKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [placements, setPlacements] = useState(
    () => initialSavedState?.placements || {}
  );
  const [activeSuspect, setActiveSuspect] = useState(0);
  const [suspectedLiar, setSuspectedLiar] = useState(() =>
    initialSavedState?.completed
      ? level?.thiefId ?? null
      : initialSavedState?.suspectedLiar ?? null
  );
  const [seconds, setSeconds] = useState(
    () => initialSavedState?.seconds || 0
  );

  const [isSolved, setIsSolved] = useState(() =>
    Boolean(initialSavedState?.completed)
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

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

  const [modalTab, setModalTab] = useState('share');
  const [leaderboardDay, setLeaderboardDay] = useState('today');
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('sandwich_detective_name') || '';
  });
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(() =>
    Boolean(initialSavedState?.scoreSubmitted)
  );
  const [submittedEntryId, setSubmittedEntryId] = useState(
    () => initialSavedState?.submittedEntryId || null
  );
  const [submitError, setSubmitError] = useState('');

  const [countdown, setCountdown] = useState(() => getTimeUntilMidnight());

  const isAnyModalOpen = isHelpModalOpen || isModeModalOpen || isShareModalOpen;

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
    if (typeof window === 'undefined' || !level) return;
    try {
      localStorage.setItem(
        'sandwich_active_session',
        JSON.stringify({ isDaily: isDailyMode, seed: level.seed })
      );
      if (!isDailyMode) {
        const currentUrlSeed = getSeedFromUrl();
        if (currentUrlSeed !== level.seed) {
          window.history.replaceState(
            {},
            '',
            `${window.location.pathname}?caso=${level.seed}`
          );
        }
      }
    } catch (_e) {
      // Ignorar
    }
  }, [isDailyMode, level]);

  useEffect(() => {
    if (typeof window === 'undefined' || !activeStorageKey) return;
    try {
      const existingRaw = localStorage.getItem(activeStorageKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : null;

      if (existing?.completed && !isSolved) return;

      const payload = {
        completed: isSolved,
        seconds: existing?.completed ? existing.seconds : seconds,
        placements: existing?.completed ? existing.placements : placements,
        suspectedLiar: isSolved ? level?.thiefId ?? suspectedLiar : suspectedLiar,
        scoreSubmitted: existing?.scoreSubmitted || scoreSubmitted,
        submittedEntryId: existing?.submittedEntryId || submittedEntryId
      };
      localStorage.setItem(activeStorageKey, JSON.stringify(payload));
    } catch (_e) {
      // Ignorar
    }
  }, [
    activeStorageKey,
    isSolved,
    seconds,
    placements,
    suspectedLiar,
    scoreSubmitted,
    submittedEntryId,
    level?.thiefId
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
    if (isShareModalOpen && isDailyMode && isSolved && scoreSubmitted) {
      fetchLeaderboard();
    }
  }, [isShareModalOpen, isDailyMode, isSolved, scoreSubmitted, fetchLeaderboard]);

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

    const nextLevel = generateCompleteLevel(
      dailyConfig.categories,
      dailyConfig.seed,
      true
    );
    if (!nextLevel) return;

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }

    setIsDailyMode(true);
    setLevel(nextLevel);
    setActiveSuspect(0);
    setIsModeModalOpen(false);
    setCopiedShare(false);

    const saved = getSavedLevelState(dailyStorageKey);
    if (saved) {
      setPlacements(saved.placements || {});
      setSuspectedLiar(
        saved.completed ? nextLevel.thiefId : saved.suspectedLiar ?? null
      );
      setSeconds(saved.seconds || 0);
      setIsSolved(Boolean(saved.completed));
      setScoreSubmitted(Boolean(saved.scoreSubmitted));
      setSubmittedEntryId(saved.submittedEntryId || null);
      return;
    }

    setPlacements({});
    setSuspectedLiar(null);
    setSeconds(0);
    setIsSolved(false);
    setScoreSubmitted(false);
    setSubmittedEntryId(null);
  }, [isDailyMode, dailyConfig, dailyStorageKey]);

  const handleNewRandomLevel = useCallback(() => {
    const nextLevel = generateCompleteLevel(null, null, false);
    if (nextLevel) {
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

  const effectiveSuspectedLiar =
    gameWon && level ? level.thiefId : suspectedLiar;

  useEffect(() => {
    if (validation?.allCluesValid && !isSolved) {
      setIsSolved(true);
      if (level) {
        setSuspectedLiar(level.thiefId);
      }
      setModalTab('share');
      setLeaderboardDay('today');
      setIsShareModalOpen(true);
    }
  }, [validation, isSolved, level]);

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

  const shareText = useMemo(() => {
    const modeLabel = isDailyMode
      ? `Expediente diario (${dailyConfig.formattedDate})`
      : `Expediente nº ${level?.caseNumber ?? ''}`;

    const shareUrl = isDailyMode
      ? 'https://www.sandwichcase.io'
      : `https://www.sandwichcase.io/?caso=${level?.seed ?? ''}`;

    return `¡Alguien ha robado mi sándwich en la oficina!\n📂 ${modeLabel}\n🥪 Culpable cazado en ${formatTime(seconds)}\n\n¿Lo resuelves más rápido que yo? 👇\n${shareUrl}`;
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

  if (!level) return null;

  const hasPlacements = Object.keys(placements).length > 0;

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
      <div className="w-full max-w-[400px] h-full flex flex-col justify-between gap-1.5 min-h-0">
        {/* 1. CABECERA */}
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

          <h1 className="font-sans text-[clamp(0.95rem,4.2vw,1.12rem)] font-black tracking-tight leading-tight flex items-center justify-center gap-1.5 min-w-0 text-center px-0.5">
            <img
              src={sandwichSvg}
              alt="Sándwich"
              className="w-[18px] h-[18px] object-contain shrink-0"
            />
            <span className="truncate">
              {isDailyMode ? (
                <>
                  Reto diario{' '}
                  <span className="font-normal">{dailyConfig.formattedDate}</span>
                </>
              ) : (
                <>
                  Caso <span className="font-normal">#{level.caseNumber}</span>
                </>
              )}
            </span>
          </h1>

          <div className="flex items-center justify-end gap-1.5 shrink-0">
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

        {/* 2. TABLERO 5x5 */}
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
              <div className="absolute top-0 inset-x-0 h-4 flex items-center justify-center pointer-events-none">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  FACHADA NORTE
                </span>
              </div>

              {/* FACHADA SUR */}
              <div className="absolute bottom-0 inset-x-0 h-4 flex items-center justify-center pointer-events-none">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  FACHADA SUR
                </span>
              </div>

              {/* FACHADA OESTE */}
              <div className="absolute left-0 inset-y-0 w-4 flex items-center justify-center pointer-events-none">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  FACHADA OESTE
                </span>
              </div>

              {/* FACHADA ESTE */}
              <div className="absolute right-0 inset-y-0 w-4 flex items-center justify-center pointer-events-none">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest [writing-mode:vertical-lr] ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  FACHADA ESTE
                </span>
              </div>

              {/* CUADRÍCULA 5x5 */}
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
                            gameWon || isVase ? 'cursor-default' : 'cursor-pointer'
                          } ${hasConflict ? 'ring-3 ring-inset ring-rose-600 z-10' : ''}`}
                        >
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

                          {!isVase && placedSuspect && (
                            <div className="relative z-10 flex flex-col items-center justify-center leading-none pointer-events-none">
                              <img
                                src={placedSuspect.emoji}
                                alt={placedSuspect.name}
                                className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                              />
                              <span
                                className={`mt-0.5 px-1.5 py-px rounded text-[8.5px] font-black leading-tight ${
                                  hasConflict
                                    ? 'bg-rose-600 text-white'
                                    : placedSuspect.id === activeSuspect
                                    ? 'bg-white text-neutral-950 ring-1 ring-[#181A20] shadow-2xs'
                                    : 'bg-[#181A20] text-white'
                                }`}
                              >
                                {placedSuspect.code}
                              </span>
                            </div>
                          )}

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
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-black text-[10px] sm:text-[11px] pointer-events-none bg-[#181A20] text-white border-2 border-white shadow-md"
                    >
                      <span className="relative z-10">{door.number}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

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

        {/* 3. BARRA DE REGLA + BOTÓN LIMPIAR MESA */}
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
                Quien está en{' '}
                <strong
                  className={`font-black ${
                    isDark ? 'text-white' : 'text-neutral-950'
                  }`}
                >
                  CRIMEN
                </strong>{' '}
                <strong
                  className={`font-black ${
                    isDark ? 'text-white' : 'text-neutral-950'
                  }`}
                >
                  miente
                </strong>
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

        {/* 4. PÍLDORAS SELECTORAS DE SOSPECHOSOS */}
        <div className="w-full grid grid-cols-5 gap-1.5 h-12 shrink-0">
          {SUSPECTS.map((s) => {
            const isSelected = activeSuspect === s.id;
            const isPlaced = suspectPositions[s.id] !== undefined;
            const evalRes = validation.clueResults ? validation.clueResults[s.id] : null;
            const isInconsistent = Boolean(evalRes && !evalRes.isConsistent);

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

            const hasLiarHypothesis = effectiveSuspectedLiar !== null;
            const isMarkedAsLiar = effectiveSuspectedLiar === s.id;

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

        {/* 5. TARJETA DE DECLARACIÓN */}
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

            <button
              type="button"
              disabled={gameWon}
              onClick={() => {
                if (gameWon) return;
                setSuspectedLiar((prev) =>
                  prev === activeSuspect ? null : activeSuspect
                );
              }}
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition shrink-0 ${
                gameWon ? 'cursor-default' : 'cursor-pointer'
              } ${
                effectiveSuspectedLiar === activeSuspect
                  ? isDark
                    ? 'text-rose-400'
                    : 'text-rose-600'
                  : `${subTextClass} ${gameWon ? '' : 'hover:opacity-80'}`
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center transition ${
                  effectiveSuspectedLiar === activeSuspect
                    ? 'bg-rose-500 border-rose-500 text-white'
                    : isDark
                    ? 'border-neutral-500 bg-transparent'
                    : 'border-neutral-400 bg-transparent'
                }`}
              >
                {effectiveSuspectedLiar === activeSuspect && (
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                )}
              </span>
              <span>Mentiroso</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center px-1">
            <p
              className={`w-full text-center font-sans text-[clamp(0.82rem,3.6vw,0.95rem)] font-normal leading-snug ${
                isDark ? 'text-neutral-200' : 'text-neutral-700'
              }`}
            >
              {renderFormattedClue(currentClue?.text, isDark)}
            </p>
          </div>
        </div>
      </div>

      {/* MODALES */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        isDark={isDark}
        subTextClass={subTextClass}
        primaryActionBtnClass={primaryActionBtnClass}
      />

      <MenuModal
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
        isDark={isDark}
        isDailyMode={isDailyMode}
        onLoadDaily={handleLoadDaily}
        onNewRandomLevel={handleNewRandomLevel}
        onOpenHelp={() => {
          setIsModeModalOpen(false);
          setIsHelpModalOpen(true);
        }}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        subTextClass={subTextClass}
      />

      <ShareModal
        isOpen={isShareModalOpen && gameWon}
        onClose={() => setIsShareModalOpen(false)}
        isDark={isDark}
        level={level}
        isDailyMode={isDailyMode}
        modalTab={modalTab}
        setModalTab={setModalTab}
        countdown={countdown}
        shareText={shareText}
        onNativeOrWhatsAppShare={handleNativeOrWhatsAppShare}
        onCopyShareText={handleCopyShareText}
        copiedShare={copiedShare}
        onNewRandomLevel={handleNewRandomLevel}
        scoreSubmitted={scoreSubmitted}
        onSubmitScore={handleSubmitScore}
        seconds={seconds}
        playerName={playerName}
        setPlayerName={setPlayerName}
        isSubmittingScore={isSubmittingScore}
        submitError={submitError}
        leaderboardDay={leaderboardDay}
        setLeaderboardDay={setLeaderboardDay}
        dailyConfig={dailyConfig}
        yesterdayConfig={yesterdayConfig}
        isLoadingBoard={isLoadingBoard}
        leaderboard={leaderboard}
        highlightedEntryId={highlightedEntryId}
        subTextClass={subTextClass}
        primaryActionBtnClass={primaryActionBtnClass}
      />

      <Analytics />
    </div>
  );
}
