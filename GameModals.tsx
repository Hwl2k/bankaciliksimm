import { useState } from 'react';
import { REJECT_REASONS, formatTRY } from '../game/rules';
import type { CustomerScenario, RankInfo, RejectReasonKey } from '../game/types';

interface RejectModalProps {
  open: boolean;
  onSelectReason: (key: RejectReasonKey) => void;
  onClose: () => void;
}

export function RejectModal({ open, onSelectReason, onClose }: RejectModalProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/65 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-300 rounded-lg max-w-md w-full p-5 shadow-xl">
        <h3 id="reject-modal-title" className="font-display font-bold text-base text-[#0A2540] mb-1.5">
          İşlem Reddetme Gerekçesi
        </h3>
        <p className="text-xs text-slate-600 mb-3">
          Denetim kayıtlarına ve müşteri dekontuna işlenecek kesin reddetme nedenini seçiniz:
        </p>
        <div className="flex flex-col gap-1.5 mb-3">
          {REJECT_REASONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onSelectReason(r.key)}
              className="w-full text-left px-3 py-2 rounded border border-slate-300 bg-slate-50 hover:bg-sky-50 hover:border-[#0A2540] text-xs font-semibold text-[#0A2540] transition-colors cursor-pointer"
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded bg-[#0A2540] hover:bg-[#143d66] text-white text-xs font-bold cursor-pointer"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}

interface DualApprovalModalProps {
  open: boolean;
  customer: CustomerScenario | null;
  rank: RankInfo;
  expectedCode: string;
  onRequestOtp: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function DualApprovalModal({
  open,
  customer,
  rank,
  expectedCode,
  onRequestOtp,
  onConfirm,
  onClose,
}: DualApprovalModalProps) {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  if (!open || !customer) return null;

  const handleConfirm = () => {
    if (pin.trim() === expectedCode) {
      setPin('');
      setPinError('');
      onConfirm();
    } else {
      setPinError('Onay kodu eşleşmiyor. Lütfen yönetici kodunu isteyiniz.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dual-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/65 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-300 rounded-lg max-w-md w-full p-5 shadow-xl">
        <h3 id="dual-modal-title" className="font-display font-bold text-base text-[#0A2540] mb-1.5">
          Üst Yetki / Çift İmza İşlem Onayı
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed mb-3">
          {customer.name} müşterisinin <strong>{formatTRY(customer.amount)}</strong> tutarındaki
          işlemi tek imza limitinizi ({formatTRY(rank.singleAuthLimit)}) aşıyor. Operasyon
          Yönetmeninden tek kullanımlık onay kodu isteyiniz.
        </p>
        <div className="flex gap-2 mb-2">
          <label htmlFor="dual-pin-input" className="sr-only">
            4 Haneli Onay Kodu
          </label>
          <input
            id="dual-pin-input"
            type="text"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setPinError('');
            }}
            placeholder="4 haneli Onay Kodu..."
            className="flex-1 px-3 py-2 rounded border border-slate-300 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => {
              onRequestOtp();
              setPin(expectedCode);
              setPinError('');
            }}
            className="px-3 py-2 rounded bg-[#0A2540] hover:bg-[#143d66] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            Onay Kodu İste
          </button>
        </div>
        {pinError && <div className="text-xs text-red-700 font-semibold mb-2">{pinError}</div>}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
          >
            Çift İmzalı Onayla
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}

interface PromotionModalProps {
  rank: RankInfo | null;
  onClose: () => void;
}

export function PromotionModal({ rank, onClose }: PromotionModalProps) {
  if (!rank) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/65 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-300 rounded-lg max-w-md w-full p-6 shadow-xl text-center">
        <p className="font-mono text-xs font-bold text-emerald-700 mb-1">
          KARİYER TERFİ BİLDİRİMİ
        </p>
        <h3 id="promo-modal-title" className="font-display font-extrabold text-xl text-[#0A2540] mb-2">
          {rank.level}. {rank.title}
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          {rank.summary} Yeni tek imza yetki limitiniz:{' '}
          <strong className="font-mono">{formatTRY(rank.singleAuthLimit)}</strong>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-sm cursor-pointer"
        >
          Yeni Görevime Başla
        </button>
      </div>
    </div>
  );
}

interface PauseModalProps {
  open: boolean;
  xp: number;
  rank: RankInfo;
  sat: number;
  errors: number;
  onResume: () => void;
  onRestart: () => void;
  onExitTitle: () => void;
}

export function PauseModal({
  open,
  xp,
  rank,
  sat,
  errors,
  onResume,
  onRestart,
  onExitTitle,
}: PauseModalProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-300 rounded-lg max-w-sm w-full p-5 shadow-xl">
        <h3 id="pause-modal-title" className="font-display font-bold text-lg text-[#0A2540] mb-3">
          Vardiya Duraklatıldı
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded p-2">
            <div className="text-[11px] text-slate-500">Kariyer XP</div>
            <div className="font-mono font-bold text-sm text-[#0A2540]">{xp}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded p-2">
            <div className="text-[11px] text-slate-500">Memnuniyet</div>
            <div className="font-mono font-bold text-sm text-emerald-700">%{sat}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded p-2">
            <div className="text-[11px] text-slate-500">Denetim</div>
            <div className="font-mono font-bold text-sm text-[#0A2540]">{errors} Hata</div>
          </div>
        </div>
        <div className="text-xs text-slate-600 mb-4 text-center">
          Mevcut Rütbe: <strong>{rank.title}</strong>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
          >
            Devam Et (Esc)
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 rounded bg-[#0A2540] hover:bg-[#143d66] text-white font-bold text-xs cursor-pointer"
          >
            Kariyeri Sıfırla
          </button>
          <button
            type="button"
            onClick={onExitTitle}
            className="w-full py-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs cursor-pointer"
          >
            Ana Ekrana Dön
          </button>
        </div>
      </div>
    </div>
  );
}
