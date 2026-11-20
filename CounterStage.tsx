import { BellRing } from 'lucide-react';
import { BANK_LOBBY_BACKDROP } from '../game/scenarios';
import type { CustomerScenario, IntranetMessage, RankInfo, SpecialChoice } from '../game/types';
import { ResilientPhoto } from './ResilientPhoto';

interface CounterStageProps {
  customer: CustomerScenario | null;
  rank: RankInfo;
  queueCount: number;
  patience: number;
  hasLastDekont: boolean;
  intranet: IntranetMessage[];
  onCallNext: () => void;
  onSpecialChoice: (choice: SpecialChoice) => void;
}

export function CounterStage({
  customer,
  rank,
  queueCount,
  patience,
  hasLastDekont,
  intranet,
  onCallNext,
  onSpecialChoice,
}: CounterStageProps) {
  const patienceColor =
    patience >= 65 ? 'bg-emerald-500' : patience >= 35 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Physical Bank Counter & Sıramatik Panel */}
      <section
        aria-label="Gişe ve Sıramatik Alanı"
        className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs flex flex-col"
      >
        {/* LED Sıramatik Board */}
        <div className="bg-[#080E18] border-b border-slate-700 px-3.5 py-2 flex items-center justify-between gap-3 font-mono">
          <div className="text-sm font-bold tracking-wider text-amber-400">
            {customer ? `ÇAĞRILAN: ${customer.ticket} → GİŞE 01` : 'GİŞE 01 · MÜŞTERİ BEKLENİYOR'}
          </div>
          <div className="text-xs text-sky-300 whitespace-nowrap">
            {customer ? `İŞLEMDE · SIRADA ${queueCount} KİŞİ` : `SIRADA ${queueCount} MÜŞTERİ`}
          </div>
        </div>

        {/* Realistic Glass Counter Scene */}
        <div className="relative h-[270px] bg-slate-900 overflow-hidden flex flex-col justify-between">
          <ResilientPhoto
            src={BANK_LOBBY_BACKDROP}
            alt="Banka şubesi müşteri salonu"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-slate-900/55 via-slate-900/20 to-slate-950/90"
          />
          {/* Subtle glass teller divider line */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-[74px] h-px bg-white/30"
          />

          {/* Top Metadata Strip inside Counter */}
          <div className="relative z-10 flex items-start justify-between p-3 gap-2">
            <span className="bg-[#0A2540]/90 text-white font-mono text-xs font-semibold px-2.5 py-1 rounded border border-white/20">
              {customer ? customer.tag : 'Gişe Hazır'}
            </span>

            <div className="bg-white/95 border border-slate-300 rounded px-2.5 py-1.5 w-36">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                <span>Müşteri Sabrı</span>
                <span className="font-mono">%{patience}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${patienceColor}`}
                  style={{ width: `${patience}%` }}
                />
              </div>
            </div>
          </div>

          {/* Customer Portrait Behind Teller Glass */}
          <div className="relative z-10 flex items-end justify-center h-[196px]">
            {customer ? (
              <div
                key={customer.id}
                className="w-[164px] h-[188px] rounded-t-xl overflow-hidden border-2 border-b-0 border-white/85 bg-slate-800 shadow-lg animate-step-up"
              >
                <ResilientPhoto
                  src={customer.photo}
                  alt={`${customer.name} müşteri fotoğrafı`}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            ) : (
              <div className="mb-10 bg-[#0A2540]/88 text-slate-100 border border-white/20 rounded-lg px-5 py-3.5 text-center max-w-xs">
                <div className="font-display font-bold text-sm text-white">Gişe 01 Boş</div>
                <div className="text-xs text-slate-300 mt-1">
                  Sıramatik butonuna basarak sıradaki müşteriyi çağırın
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desk Console & Primary Sıramatik Call Button */}
        <div className="bg-[#0A2540] text-slate-100 px-3.5 py-2.5 flex items-center justify-between gap-3 border-t border-slate-700">
          <div className="min-w-0">
            <div className="font-mono text-xs font-bold text-emerald-300 truncate">
              {rank.deskPlate}
            </div>
            <div className="font-mono text-[11px] text-slate-300 truncate">
              F9 Sıradaki · 1–8 Sekmeler · Esc Duraklat
            </div>
          </div>
          <button
            type="button"
            onClick={onCallNext}
            disabled={Boolean(customer)}
            className={`px-4 py-2 rounded font-display font-bold text-xs flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              customer
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-500 hover:bg-emerald-400 text-[#041423] border border-emerald-300 shadow-sm'
            }`}
          >
            <BellRing className="w-4 h-4" aria-hidden="true" />
            <span>Sıramatik: Sıradaki (F9)</span>
          </button>
        </div>

        {/* Customer Dialogue Area */}
        <div className="p-3.5 bg-white border-t border-slate-200">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-display font-bold text-[#0A2540]">
              {customer ? `${customer.name} · #${customer.ticket}` : 'Gişe Beklemede'}
            </span>
            <span className="text-slate-500">
              {customer
                ? customer.eventType === 'outage'
                  ? 'Gergin'
                  : customer.eventType === 'scam'
                    ? 'Telefonda Panik Halde'
                    : 'Gişe Önünde'
                : 'Hazır'}
            </span>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5">
            {customer
              ? `“${customer.dialogue}”`
              : hasLastDekont
                ? 'Önceki müşteri uğurlandı. Yeni müşteriyi davet etmek için Sıramatik: Sıradaki (F9) butonuna basın.'
                : 'Sıramatikten sıradaki müşteriyi çağırarak işlemlere başlayın.'}
          </p>

          {customer?.choices && (
            <div className="mt-2.5 flex flex-col gap-1.5">
              {customer.choices.map((ch, idx) => (
                <button
                  key={ch.label}
                  type="button"
                  onClick={() => onSpecialChoice(ch)}
                  className="w-full text-left px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 hover:border-[#0A2540] text-xs font-semibold text-[#0A2540] transition-colors cursor-pointer"
                >
                  {idx + 1}. {ch.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AuraNet Intranet Messaging */}
      <section
        aria-label="AuraNet Şube İçi Mesajlaşma"
        className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs flex flex-col flex-1"
      >
        <div className="bg-slate-100 border-b border-slate-300 px-3.5 py-2 flex items-center justify-between text-xs font-bold text-[#0A2540]">
          <span>AuraNet · Şube İçi Yazışma ve Uyarılar</span>
          <span className="text-emerald-700 font-mono">Çevrimiçi</span>
        </div>
        <div className="p-2.5 bg-slate-50 flex-1 max-h-64 min-h-36 overflow-y-auto flex flex-col gap-2">
          {intranet.map((msg) => {
            const toneClass =
              msg.kind === 'alert'
                ? 'bg-red-50/80 border-red-200'
                : msg.kind === 'rate'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-white border-slate-200';
            return (
              <div key={msg.id} className={`border rounded px-2.5 py-2 text-xs ${toneClass}`}>
                <div className="flex items-center justify-between font-semibold text-[#0A2540] mb-0.5">
                  <span>{msg.sender}</span>
                  <span className="font-mono text-[11px] text-slate-500">{msg.time}</span>
                </div>
                <div className="text-slate-700 leading-snug">{msg.text}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
