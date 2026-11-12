import React from 'react';
import { X } from 'lucide-react';

export default function HelpModal({
  isOpen,
  onClose,
  isDark,
  t,
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
                {t.helpTitle}
              </h2>
              <p className={`text-xs mt-0.5 ${subTextClass}`}>
                {t.helpSubtitle}
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

        <div className="flex flex-col gap-3 text-xs leading-relaxed">
          <div
            className={`p-3 rounded-2xl border ${
              isDark
                ? 'bg-[#14161B] border-[#2C303A] text-neutral-300'
                : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}
          >
            <span className="font-black block mb-0.5 text-current">
              {t.helpRule1Title}
            </span>
            {t.helpRule1Body1} <strong>{t.helpRule1Bold}</strong>.{' '}
            {t.helpRule1Body2}
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDark
                ? 'bg-[#14161B] border-[#2C303A] text-neutral-300'
                : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}
          >
            <span className="font-black block mb-0.5 text-current">
              {t.helpRule2Title}
            </span>
            {t.helpRule2Body1} <strong>{t.helpRule2Bold1}</strong>{' '}
            {t.helpRule2Body2} <strong>{t.helpRule2Bold2}</strong>.
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDark
                ? 'bg-[#14161B] border-[#2C303A] text-neutral-300'
                : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}
          >
            <span className="font-black block mb-0.5 text-current">
              {t.helpRule3Title}
            </span>
            {t.helpRule3Body1} <strong>{t.helpRule3Bold}</strong>{' '}
            {t.helpRule3Body2}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`w-full py-2.5 px-4 rounded-xl font-black text-xs transition cursor-pointer ${primaryActionBtnClass}`}
        >
          {t.helpCta}
        </button>
      </div>
    </div>
  );
}
