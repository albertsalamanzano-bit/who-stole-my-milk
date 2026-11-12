import React from 'react';
import {
  X,
  Trophy,
  Share2,
  Check,
  Copy,
  Sparkles,
  Send,
  History
} from 'lucide-react';
import { SUSPECTS, sandwichSvg } from '../constants/gameData';
import { cleanStatementText, formatTime, supabase } from '../lib/supabase';

export default function ShareModal({
  isOpen,
  onClose,
  isDark,
  level,
  isDailyMode,
  modalTab,
  setModalTab,
  countdown,
  shareText,
  onNativeOrWhatsAppShare,
  onCopyShareText,
  copiedShare,
  onNewRandomLevel,
  scoreSubmitted,
  onSubmitScore,
  seconds,
  playerName,
  setPlayerName,
  isSubmittingScore,
  submitError,
  leaderboardDay,
  setLeaderboardDay,
  dailyConfig,
  yesterdayConfig,
  isLoadingBoard,
  leaderboard,
  highlightedEntryId,
  subTextClass,
  primaryActionBtnClass
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
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
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
              isDark
                ? 'bg-[#14161B] border-[#2C303A] text-neutral-400 hover:text-white'
                : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de Pestañas: 1º Informe RR.HH. | 2º Ranking */}
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
                onClick={onNativeOrWhatsAppShare}
                className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${primaryActionBtnClass}`}
              >
                <Share2 className="w-4 h-4" />
                <span>Presumir en el grupo</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onCopyShareText}
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
                  onClick={onNewRandomLevel}
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

        {/* PESTAÑA 2: RANKING (REQUIERE REGISTRAR TIEMPO CON APODO PARA VERLO) */}
        {isDailyMode && modalTab === 'leaderboard' && (
          <div className="flex flex-col gap-2.5 min-h-0 flex-1 overflow-hidden">
            {!scoreSubmitted ? (
              <form
                onSubmit={onSubmitScore}
                className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                  isDark
                    ? 'bg-[#14161B] border-[#2C303A]'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black">
                      Registra tu tiempo para ver el ranking
                    </span>
                    <span className="font-mono font-black text-emerald-500">
                      {formatTime(seconds)}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-snug ${subTextClass}`}>
                    Introduce tu apodo para guardar tu marca de hoy y desbloquear la clasificación.
                  </p>
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
                    className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${primaryActionBtnClass}`}
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isSubmittingScore ? '...' : 'Ver ranking'}
                    </span>
                  </button>
                </div>

                {submitError && (
                  <span className="text-[10px] text-rose-500 font-bold">
                    {submitError}
                  </span>
                )}
              </form>
            ) : (
              <>
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
                                isDark
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
