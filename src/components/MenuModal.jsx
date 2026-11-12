import React from 'react';
import {
  X,
  Calendar,
  Shuffle,
  HelpCircle,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { sandwichSvg } from '../constants/gameData';

export default function MenuModal({
  isOpen,
  onClose,
  isDark,
  isDailyMode,
  onLoadDaily,
  onNewRandomLevel,
  onOpenHelp,
  themeMode,
  setThemeMode,
  subTextClass
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
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
                ¿Qué sándwich robado investigamos ahora?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            onClick={onLoadDaily}
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
                <div className="text-xs font-black">Reto del Día</div>
                <div
                  className={`text-[11px] ${
                    isDailyMode
                      ? isDark
                        ? 'text-neutral-700'
                        : 'text-neutral-300'
                      : subTextClass
                  }`}
                >
                  El mismo misterio para todos
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
            onClick={onNewRandomLevel}
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
                <div className="text-xs font-black">Generar crimen</div>
                <div
                  className={`text-[11px] ${
                    !isDailyMode
                      ? isDark
                        ? 'text-neutral-700'
                        : 'text-neutral-300'
                      : subTextClass
                  }`}
                >
                  Generar un nuevo drama con semilla
                </div>
              </div>
            </div>
            {!isDailyMode && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                Activo
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
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

        {/* Selector de apariencia: Claro / Oscuro / Sistema */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-1 ${subTextClass}`}
          >
            Apariencia
          </span>
          <div
            className={`grid grid-cols-3 p-1 rounded-2xl border ${
              isDark
                ? 'bg-[#14161B] border-[#2C303A]'
                : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            {[
              { id: 'light', label: 'Claro', Icon: Sun },
              { id: 'dark', label: 'Oscuro', Icon: Moon },
              { id: 'system', label: 'Sistema', Icon: Monitor }
            ].map(({ id, label, Icon }) => {
              const active = themeMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setThemeMode(id)}
                  className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    active
                      ? isDark
                        ? 'bg-[#282B34] text-white shadow-2xs'
                        : 'bg-white text-neutral-900 shadow-2xs'
                      : subTextClass
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
