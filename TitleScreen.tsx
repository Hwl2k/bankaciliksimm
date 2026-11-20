import { BANK_LOBBY_BACKDROP } from '../game/scenarios';
import { ResilientPhoto } from './ResilientPhoto';

interface TitleScreenProps {
  hasSavedProgress: boolean;
  savedRankTitle: string;
  savedXp: number;
  onStartNew: () => void;
  onContinue: () => void;
}

export function TitleScreen({
  hasSavedProgress,
  savedRankTitle,
  savedXp,
  onStartNew,
  onContinue,
}: TitleScreenProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061526] text-white flex flex-col justify-between">
      {/* Illustrated Key-Art Bank Lobby Backdrop */}
      <ResilientPhoto
        src={BANK_LOBBY_BACKDROP}
        alt="AuraBank modern şube salonu"
        className="absolute inset-0 w-full h-full object-cover opacity-55"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#061526]/95 via-[#061526]/80 to-[#061526]/45"
      />

      {/* Top Subtle Crest Bar */}
      <div className="relative z-10 max-w-6xl w-full mx-auto px-8 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            width="42"
            height="42"
            viewBox="0 0 48 48"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="48" height="48" rx="10" fill="#0A2540" stroke="#10B981" strokeWidth="2" />
            <path
              d="M14 34L22 14H26L34 34H29.5L27.8 29.2H20.2L18.5 34H14ZM21.4 25.6H26.6L24 18.2L21.4 25.6Z"
              fill="#ECFDF5"
            />
            <path d="M12 38H36" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div>
            <div className="font-display font-bold text-lg tracking-tight text-white">
              AuraBank
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Şube #034 · Core Banking Terminali
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-xs font-mono text-slate-300">
          20.11.2026 · Marmara Bölge Ağı
        </div>
      </div>

      {/* Main Hero Editorial Lockup over Calm Negative Space */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-8 py-12 flex-1 flex items-center">
        <div className="max-w-xl">
          <p className="text-xs font-mono tracking-wide text-emerald-300 mb-3">
            Gişe Yetkilisinden Bölge Müdürlüğüne
          </p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight tracking-tight text-white text-balance mb-5">
            Gerçek Bankacılık Operasyonları ve Kariyer Simülasyonu
          </h1>
          <p className="text-base text-slate-200 leading-relaxed mb-8">
            Sıramatikten sıradaki müşteriyi çağırın, biyometrik kimlik ve imza eşleşmelerini
            denetleyin, UV dedektörüyle sahte banknotları yakalayın ve 8 modüllü Core Banking
            ekranıyla Bölge Müdürlüğüne kadar yükselin.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {hasSavedProgress ? (
              <>
                <button
                  type="button"
                  data-start="true"
                  onClick={onContinue}
                  className="px-6 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                >
                  Vardiyaya Devam Et ({savedRankTitle} · {savedXp} XP)
                </button>
                <button
                  type="button"
                  onClick={onStartNew}
                  className="px-5 py-3.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-slate-100 font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Yeni Kariyer Başlat
                </button>
              </>
            ) : (
              <button
                type="button"
                data-start="true"
                onClick={onStartNew}
                className="px-7 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                Vardiyaya Başla
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Clean Single-Line Control Hint in Bottom Safe Margin */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-8 pb-7 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300 font-mono">
        <span>Enter Başla · F9 Sıradaki Müşteri · 1–8 Terminal Sekmeleri · Esc Duraklat</span>
        <span>AuraBank Eğitim ve Operasyon Sistemi</span>
      </footer>
    </div>
  );
}
