import { useState } from 'react';
import {
  CheckCircle2,
  FileSearch,
  Flashlight,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import {
  FX_RATES,
  RANKS,
  calculateFxReturn,
  calculateLoanInstallment,
  calculateVaultDenominations,
  formatTRY,
} from '../game/rules';
import type {
  AuditEntry,
  CustomerScenario,
  DekontRecord,
  MasakEntry,
  RankInfo,
  TabId,
} from '../game/types';
import { ResilientPhoto } from './ResilientPhoto';
import { SignatureSvg } from './SignatureSvg';

interface CoreTerminalProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  customer: CustomerScenario | null;
  lastDekont: DekontRecord | null;
  rank: RankInfo;
  cash: number;
  uvScanned: boolean;
  dbQueried: boolean;
  logs: AuditEntry[];
  masakLogs: MasakEntry[];
  onScanUv: () => void;
  onFetchActiveDb: () => void;
  onQueryTckn: (tckn: string) => void;
  onApprove: () => void;
  onOpenReject: () => void;
  onMasakReport: () => void;
  onVaultReconcile: () => void;
  onRegionSync: () => void;
}

const TABS: Array<{ id: TabId; code: string; label: string }> = [
  { id: 't101', code: '101', label: 'Gişe' },
  { id: 't204', code: '204', label: 'Müşteri 360°' },
  { id: 't310', code: '310', label: 'Findeks' },
  { id: 't405', code: '405', label: 'Döviz' },
  { id: 't512', code: '512', label: 'Çek/KOBİ' },
  { id: 't608', code: '608', label: 'Kasa' },
  { id: 't720', code: '720', label: 'MASAK' },
  { id: 't850', code: '850', label: 'Yönetim' },
];

export function CoreTerminal({
  activeTab,
  onTabChange,
  customer,
  lastDekont,
  rank,
  cash,
  uvScanned,
  dbQueried,
  logs,
  masakLogs,
  onScanUv,
  onFetchActiveDb,
  onQueryTckn,
  onApprove,
  onOpenReject,
  onMasakReport,
  onVaultReconcile,
  onRegionSync,
}: CoreTerminalProps) {
  const [tcknInput, setTcknInput] = useState('');
  const [loanAmt, setLoanAmt] = useState(150_000);
  const [loanTerm, setLoanTerm] = useState(12);
  const [loanRate, setLoanRate] = useState(3.89);
  const [loanIncome, setLoanIncome] = useState(50_000);
  const [fxRate, setFxRate] = useState(34.2);
  const [fxForeign, setFxForeign] = useState(2500);

  const loanCalc = calculateLoanInstallment(
    loanAmt,
    loanTerm,
    loanRate,
    loanIncome,
    customer?.debt ?? 0
  );
  const fxResult = calculateFxReturn(fxRate, fxForeign);
  const vaultRows = calculateVaultDenominations(cash);
  const requiresDual = Boolean(customer && customer.amount > rank.singleAuthLimit);

  return (
    <section
      aria-label="AuraCore Bankacı Terminali"
      className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs flex flex-col h-full"
    >
      {/* 8-Module Single-Row Tab Bar */}
      <div
        role="tablist"
        aria-label="Core Banking Modülleri"
        className="bg-[#0A2540] px-2 pt-2 flex items-center gap-1 overflow-x-auto border-b border-slate-300"
      >
        {TABS.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(t.id)}
              className={`px-2.5 py-2 rounded-t text-[11.5px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-[#0A2540]'
                  : 'bg-[#123355] text-slate-200 hover:bg-[#194470] hover:text-white'
              }`}
            >
              <span className="font-mono text-[10.5px] opacity-80 mr-1">[{t.code}]</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB [101] GİŞE & EVRAK */}
      {activeTab === 't101' && (
        <div role="tabpanel" className="p-3.5 flex flex-col gap-3 flex-1">
          {/* Order Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-md p-2.5">
            <div>
              <div className="text-[11px] font-semibold text-slate-500">İşlem Tipi</div>
              <div className="font-mono text-xs font-bold text-[#0A2540] mt-0.5 truncate">
                {customer ? customer.op : 'Beklemede'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Talep Tutarı</div>
              <div className="font-mono text-xs font-bold text-[#0A2540] mt-0.5">
                {customer ? (customer.amount > 0 ? formatTRY(customer.amount) : 'Bilgi / Kriz') : '-'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Beyan TCKN</div>
              <div className="font-mono text-xs font-bold text-[#0A2540] mt-0.5">
                {customer ? customer.tckn : '-'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Tek İmza Limiti</div>
              <div className="font-mono text-xs font-bold text-[#0A2540] mt-0.5">
                {formatTRY(rank.singleAuthLimit)}
              </div>
            </div>
          </div>

          {/* Documents or Dekont Receipt */}
          {customer ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Realistic T.C. Kimlik Kartı */}
                <div className="rounded-lg border border-sky-300 bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-blue-900 border-b border-sky-300 pb-1.5 mb-2.5">
                      <span>TÜRKİYE CUMHURİYETİ KİMLİK KARTI</span>
                      <span className="font-mono">SERİ: A14K82</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-20 h-24 rounded border border-blue-400 overflow-hidden bg-slate-200 shrink-0">
                        <ResilientPhoto
                          src={customer.idPhoto}
                          alt={`${customer.name} kimlik fotoğrafı`}
                          className="w-full h-full object-cover object-top contrast-105 saturate-90"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-emerald-400/80 to-sky-300/80 border border-white/80"
                        />
                      </div>
                      <div className="flex flex-col gap-1 text-xs min-w-0">
                        <div>
                          <div className="text-[10px] text-slate-600">T.C. Kimlik No</div>
                          <div className="font-mono font-bold text-slate-900">{customer.tckn}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-600">Adı Soyadı</div>
                          <div className="font-mono font-bold text-slate-900 truncate">
                            {customer.name}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div>
                            <div className="text-[10px] text-slate-600">Doğum</div>
                            <div className="font-mono font-semibold text-slate-900">{customer.dob}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-600">Son Geçerlilik</div>
                            <div className="font-mono font-semibold text-slate-900">{customer.exp}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 bg-white/80 border border-dashed border-sky-400 rounded px-2.5 py-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">Belge İmzası:</span>
                    <SignatureSvg style={customer.sig} label={`${customer.name} belge imzası`} />
                  </div>
                </div>

                {/* Supporting Slip + UV Scanner */}
                <div className="rounded-lg border border-amber-300 bg-amber-50/55 p-3 flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 border-b border-dashed border-amber-400 pb-1.5 mb-2">
                      <span>{customer.docTitle}</span>
                      <span className="font-mono">#{customer.ticket}</span>
                    </div>
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        {customer.docRows.map(([k, v]) => (
                          <tr key={k} className="border-b border-amber-200/70 last:border-b-0">
                            <td className="py-1.5 text-slate-700">{k}</td>
                            <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                              {v}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {customer.hasUv && (
                    <div className="bg-slate-900 text-slate-100 rounded-md p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-slate-400">
                          UV Banknot Dedektörü
                        </div>
                        <div
                          className={`font-mono text-xs font-bold mt-0.5 ${
                            !uvScanned
                              ? 'text-slate-200'
                              : customer.uvValid
                                ? 'text-emerald-400'
                                : 'text-red-400'
                          }`}
                        >
                          {!uvScanned
                            ? 'Tarama bekleniyor...'
                            : customer.uvValid
                              ? 'Onaylı: Gerçek Banknot'
                              : 'Sahte Banknot Tespiti!'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onScanUv}
                        className="px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Flashlight className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>UV Tara</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Dual-auth notice */}
              <div className="bg-slate-100 border border-slate-300 rounded px-3 py-2 flex items-center justify-between gap-2 text-xs">
                <span>
                  <strong className="text-[#0A2540]">Onay Yetkisi:</strong>{' '}
                  {requiresDual ? (
                    <span className="font-semibold text-red-700">
                      Yetki üstü tutar ({formatTRY(customer.amount)} &gt; {formatTRY(rank.singleAuthLimit)}) · Çift imza OTP gereklidir
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-700">
                      Tek imza limitiniz dahilinde
                    </span>
                  )}
                </span>
                <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">
                  [204] üzerinden Core DB kontrolü önerilir
                </span>
              </div>
            </>
          ) : lastDekont ? (
            <div className="border border-dashed border-slate-500 bg-[#FFFFF8] rounded-md p-4 font-mono text-xs leading-relaxed">
              <div className="flex items-center justify-between border-b border-dashed border-slate-400 pb-2 mb-2.5">
                <strong className="text-slate-900">
                  AURABANK RESMİ İŞLEM DEKONTU · REF #{lastDekont.ref}
                </strong>
                <span
                  className={`px-2 py-0.5 rounded border-2 font-bold ${
                    lastDekont.ok
                      ? 'text-emerald-700 border-emerald-700'
                      : 'text-red-700 border-red-700'
                  }`}
                >
                  {lastDekont.stamp}
                </span>
              </div>
              <div className="text-slate-700">
                TARİH: 20.11.2026 · GİŞE: 01 · YETKİLİ: {lastDekont.officerTitle}
              </div>
              <div className="text-slate-900 font-semibold mt-0.5">
                MÜŞTERİ: {lastDekont.name} ({lastDekont.ticket}) · İŞLEM: {lastDekont.op} · TUTAR:{' '}
                {lastDekont.amount > 0 ? formatTRY(lastDekont.amount) : '-'}
              </div>
              <div
                className={`mt-2.5 pt-2 border-t border-dotted border-slate-400 font-sans text-xs ${
                  lastDekont.ok ? 'text-emerald-800' : 'text-red-800'
                }`}
              >
                <strong>Denetim Notu:</strong> {lastDekont.feedback}
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 bg-slate-50 rounded-md p-8 text-center text-xs text-slate-500">
              Evrak masası boş. Sıramatikten müşteri çağırdığınızda kimlik kartı ve işlem belgeleri
              burada görüntülenecektir.
            </div>
          )}

          {/* Decision Stamp Buttons */}
          {!customer?.choices && (
            <div className="mt-auto pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!customer}
                onClick={onApprove}
                className="flex-1 min-w-[160px] px-4 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 disabled:cursor-not-allowed text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>İşlemi Onayla &amp; Dekont Bas</span>
              </button>
              <button
                type="button"
                disabled={!customer}
                onClick={onOpenReject}
                className="flex-1 min-w-[160px] px-4 py-2.5 rounded bg-red-600 hover:bg-red-500 disabled:opacity-45 disabled:cursor-not-allowed text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
                <span>Reddet (Gerekçe Seç)</span>
              </button>
              <button
                type="button"
                disabled={!customer}
                onClick={onMasakReport}
                className="px-4 py-2.5 rounded bg-amber-900 hover:bg-amber-800 disabled:opacity-45 disabled:cursor-not-allowed text-amber-50 border border-amber-500 font-display font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                <span>MASAK Bildir</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB [204] MÜŞTERİ 360° & BİYOMETRİ */}
      {activeTab === 't204' && (
        <div role="tabpanel" className="p-3.5 flex flex-col gap-3 flex-1">
          <div className="flex flex-wrap gap-2">
            <label htmlFor="tckn-search" className="sr-only">
              T.C. Kimlik Numarası
            </label>
            <input
              id="tckn-search"
              type="text"
              value={tcknInput}
              onChange={(e) => setTcknInput(e.target.value)}
              placeholder="T.C. Kimlik Numarası ile Core DB sorgula..."
              className="flex-1 min-w-[200px] px-3 py-2 rounded border border-slate-300 font-mono text-xs bg-white"
            />
            <button
              type="button"
              onClick={() => onQueryTckn(tcknInput)}
              className="px-4 py-2 rounded bg-[#0A2540] hover:bg-[#143d66] text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSearch className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sorgula</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (customer) setTcknInput(customer.tckn);
                onFetchActiveDb();
              }}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Aktif Müşteriyi Getir
            </button>
          </div>

          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            {customer && dbQueried ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="shrink-0 text-center">
                  <ResilientPhoto
                    src={customer.photo}
                    alt={`${customer.name} biyometrik kayıt`}
                    className="w-24 h-28 object-cover object-top rounded border-2 border-[#0A2540]"
                  />
                  <div className="text-[10px] font-mono font-bold text-[#0A2540] mt-1">
                    BİYOMETRİK ARŞİV
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <table className="w-full text-xs border-collapse bg-white border border-slate-200">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <th className="text-left p-2 bg-slate-100 text-[#0A2540] w-36">
                          Ad Soyad / TCKN
                        </th>
                        <td className="p-2 font-mono">
                          {customer.name} · {customer.tckn}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <th className="text-left p-2 bg-slate-100 text-[#0A2540]">Vadesiz IBAN</th>
                        <td className="p-2 font-mono">{customer.iban}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <th className="text-left p-2 bg-slate-100 text-[#0A2540]">
                          Kayıtlı Bakiye
                        </th>
                        <td className="p-2 font-mono font-bold">{formatTRY(customer.balance)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <th className="text-left p-2 bg-slate-100 text-[#0A2540]">
                          Kayıtlı Net Gelir
                        </th>
                        <td className="p-2 font-mono">{formatTRY(customer.income)}</td>
                      </tr>
                      <tr>
                        <th className="text-left p-2 bg-slate-100 text-[#0A2540]">
                          Uyum / Kara Liste
                        </th>
                        <td
                          className={`p-2 font-bold ${
                            customer.blacklist ? 'text-red-700' : 'text-emerald-700'
                          }`}
                        >
                          {customer.blacklist ? 'Uyarı: Şüpheli Hareket / Kara Liste' : 'Temiz'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-2.5 bg-white border border-dashed border-slate-300 rounded px-3 py-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Sistemdeki İmza Örneği:
                    </span>
                    <SignatureSvg
                      style={customer.coreSig}
                      label={`${customer.name} sistemdeki imza örneği`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                {customer
                  ? 'Aktif müşterinin Core Banking biyometri ve imza kaydını yüklemek için "Aktif Müşteriyi Getir" butonuna tıklayın.'
                  : 'Önce Sıramatikten bir müşteri çağırın.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB [310] KREDİ & FİNDEKS */}
      {activeTab === 't310' && (
        <div role="tabpanel" className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            <h3 className="text-xs font-bold text-[#0A2540] border-b border-slate-200 pb-1.5 mb-2.5">
              Findeks &amp; KKB Ödeme İstihbaratı
            </h3>
            {customer && dbQueried ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Findeks Kredi Notu</span>
                  <span
                    className={`font-mono ${
                      customer.findeks < 1100 ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {customer.findeks} / 1900 (Eşik: 1100)
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500">
                  <div
                    className="absolute -top-1 w-1 h-4.5 bg-[#0A2540] rounded"
                    style={{
                      left: `${Math.min(98, Math.max(2, Math.round((customer.findeks / 1900) * 100)))}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-slate-700">
                  Son 6 Ay KKB Ödeme Düzeni:
                </div>
                <div className="grid grid-cols-6 gap-1 text-center">
                  {customer.kkb.map((item, idx) => (
                    <div
                      key={`${customer.id}-kkb-${idx}`}
                      className={`p-1 rounded border text-[10px] font-bold ${
                        item === '✓'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      <div>Ay {idx + 1}</div>
                      <div>{item}</div>
                    </div>
                  ))}
                </div>
                <table className="w-full text-xs bg-white border border-slate-200">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-1.5">Mevcut Aylık Borç</td>
                      <td className="p-1.5 text-right font-mono">{formatTRY(customer.debt)}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5">Maks. Taksit Limiti (%50 Gelir)</td>
                      <td className="p-1.5 text-right font-mono font-bold">
                        {formatTRY(Math.round(customer.income * 0.5))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                [204] Müşteri 360° ekranından müşteri sorguladıktan sonra KKB raporu yüklenir.
              </div>
            )}
          </div>

          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            <h3 className="text-xs font-bold text-[#0A2540] border-b border-slate-200 pb-1.5 mb-2.5">
              Kredi Taksit &amp; Gelir Oranı (DTI) Hesaplayıcı
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-slate-600">Kredi Tutarı (₺)</span>
                <input
                  type="number"
                  value={loanAmt}
                  onChange={(e) => setLoanAmt(Number(e.target.value))}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-slate-600">Vade (Ay)</span>
                <input
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-slate-600">Aylık Faiz (%)</span>
                <input
                  type="number"
                  step="0.1"
                  value={loanRate}
                  onChange={(e) => setLoanRate(Number(e.target.value))}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-slate-600">Net Gelir (₺)</span>
                <input
                  type="number"
                  value={loanIncome}
                  onChange={(e) => setLoanIncome(Number(e.target.value))}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                />
              </label>
            </div>
            <div className="bg-white border border-slate-200 rounded p-2.5 font-mono text-xs flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Aylık Taksit:</span>
                <strong>{formatTRY(loanCalc.monthlyPayment)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Toplam Borç/Gelir (DTI):</span>
                <strong className={loanCalc.isOverLimit ? 'text-red-700' : 'text-emerald-700'}>
                  %{loanCalc.dtiPercent} {loanCalc.isOverLimit ? '(Limit Aşımı)' : '(Uygun)'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB [405] DÖVİZ (FX) MASASI */}
      {activeTab === 't405' && (
        <div role="tabpanel" className="p-3.5 flex flex-col gap-3 flex-1">
          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            <h3 className="text-xs font-bold text-[#0A2540] mb-2">
              AuraBank Anlık Gişe Kur Tahtası
            </h3>
            <table className="w-full text-xs bg-white border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[#0A2540]">
                  <th className="text-left p-2 border border-slate-200">Döviz Cinsi</th>
                  <th className="text-right p-2 border border-slate-200">Banka Alış</th>
                  <th className="text-right p-2 border border-slate-200">Banka Satış</th>
                  <th className="text-right p-2 border border-slate-200">Marj</th>
                </tr>
              </thead>
              <tbody>
                {FX_RATES.map((fx) => (
                  <tr key={fx.code}>
                    <td className="p-2 border border-slate-200 font-semibold">
                      {fx.code} · {fx.label}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-mono">
                      {fx.buy.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-mono">
                      {fx.sell.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-mono">{fx.spread}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            <h3 className="text-xs font-bold text-[#0A2540] mb-2">
              Döviz Alım / Satım Tutar Doğrulama
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="fx-select" className="sr-only">
                Kur Seçimi
              </label>
              <select
                id="fx-select"
                value={fxRate}
                onChange={(e) => setFxRate(Number(e.target.value))}
                className="px-2.5 py-2 rounded border border-slate-300 bg-white font-mono text-xs"
              >
                <option value={34.2}>USD Bozdurma (Alış 34.20)</option>
                <option value={34.85}>USD Satış (34.85)</option>
                <option value={36.1}>EUR Bozdurma (Alış 36.10)</option>
                <option value={36.8}>EUR Satış (36.80)</option>
              </select>
              <label htmlFor="fx-amount" className="sr-only">
                Döviz Tutarı
              </label>
              <input
                id="fx-amount"
                type="number"
                value={fxForeign}
                onChange={(e) => setFxForeign(Number(e.target.value))}
                className="w-32 px-2.5 py-2 rounded border border-slate-300 bg-white font-mono text-xs"
              />
              <span className="font-mono text-sm font-bold text-emerald-700 ml-auto">
                Karşılık: {formatTRY(fxResult)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB [512] FATURA & ÇEK/KOBİ */}
      {activeTab === 't512' && (
        <div role="tabpanel" className="p-3.5 flex flex-col gap-3 flex-1">
          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            <h3 className="text-xs font-bold text-[#0A2540] mb-2">
              Çek Karekod ve KOBİ Bilanço İstihbaratı
            </h3>
            {customer?.chequeInfo ? (
              <table className="w-full text-xs bg-white border border-slate-200 border-collapse">
                <tbody>
                  <tr>
                    <th className="text-left p-2 bg-slate-100 border border-slate-200">
                      Keşideci Firma
                    </th>
                    <td className="p-2 border border-slate-200 font-semibold">
                      {customer.chequeInfo.drawer}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-left p-2 bg-slate-100 border border-slate-200">
                      Findeks Çek Karekod Durumu
                    </th>
                    <td className="p-2 border border-slate-200 font-bold text-red-700">
                      {customer.chequeInfo.qrStatus}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-left p-2 bg-slate-100 border border-slate-200">
                      Cari Oran (İdeal &gt; 1.2)
                    </th>
                    <td className="p-2 border border-slate-200 font-mono text-red-700">
                      {customer.chequeInfo.currentRatio}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-left p-2 bg-slate-100 border border-slate-200">
                      Toplam Borç / Özsermaye
                    </th>
                    <td className="p-2 border border-slate-200 font-mono text-red-700">
                      {customer.chequeInfo.debtEquity}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="text-xs text-slate-500 py-8 text-center">
                Aktif işlemde ticari çek karekod veya şirket bilanço sorgusu bulunmuyor.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB [608] KASA & KUPÜR */}
      {activeTab === 't608' && (
        <div role="tabpanel" className="p-3.5 flex flex-col gap-3 flex-1">
          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            <h3 className="text-xs font-bold text-[#0A2540] mb-2">
              Gişe 01 Nakit Kupür Envanteri
            </h3>
            <table className="w-full text-xs bg-white border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[#0A2540]">
                  <th className="text-left p-2 border border-slate-200">Kupür</th>
                  <th className="text-right p-2 border border-slate-200">Adet</th>
                  <th className="text-right p-2 border border-slate-200">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {vaultRows.map((row) => (
                  <tr key={row.label}>
                    <td className="p-2 border border-slate-200">{row.label}</td>
                    <td className="p-2 border border-slate-200 text-right font-mono">
                      {row.count !== null ? row.count.toLocaleString('tr-TR') : 'Karma'}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-mono font-semibold">
                      {formatTRY(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[#0A2540]">
                Toplam Fiziki Kasa: {formatTRY(cash)}
              </span>
              <button
                type="button"
                onClick={onVaultReconcile}
                className="px-3.5 py-2 rounded bg-[#0A2540] hover:bg-[#143d66] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                Kasa Mutabakatı Yap (+15 XP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB [720] MASAK UYUM */}
      {activeTab === 't720' && (
        <div role="tabpanel" className="p-3.5 flex flex-col gap-3 flex-1">
          <div className="border border-slate-200 bg-slate-50 rounded-md p-3 text-xs text-slate-700 leading-relaxed">
            <h3 className="font-bold text-[#0A2540] mb-1.5">
              MASAK Şüpheli İşlem Bildirim (ŞİB) Kriterleri
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Faturasız veya kaynağı belirsiz yüksek tutarlı nakit girişleri ve bildirim
                sınırından kaçınmaya yönelik parçalı (şirinleme / smurfing) işlemler.
              </li>
              <li>
                Core DB üzerinde kara liste veya kısa sürede tekrarlayan olağandışı nakit hareketi
                uyarısı bulunan ticari hesaplar.
              </li>
              <li>
                Telefonla yönlendirilen yaşlı müşterilerde MASAK yerine{' '}
                <strong>Reddet · Telefon Dolandırıcılığı Mağduru</strong> prosedürü uygulanır.
              </li>
            </ul>
          </div>
          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            <h3 className="text-xs font-bold text-[#0A2540] mb-2">
              Gönderilen MASAK Bildirim Kayıtları
            </h3>
            {masakLogs.length > 0 ? (
              <div className="flex flex-col gap-1.5 text-xs">
                {masakLogs.map((m) => (
                  <div
                    key={`${m.ticket}-${m.time}`}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 flex justify-between"
                  >
                    <span>
                      <strong>#{m.ticket}</strong> · {m.name}
                    </span>
                    <span className="font-mono">
                      {formatTRY(m.amount)} · {m.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Henüz ŞİB kaydı oluşturulmadı.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB [850] ŞUBE & BÖLGE YÖNETİMİ */}
      {activeTab === 't850' && (
        <div role="tabpanel" className="p-3.5 flex flex-col gap-3 flex-1">
          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            <h3 className="text-xs font-bold text-[#0A2540] mb-2">
              Kariyer Basamakları (Gişe Yetkilisinden Bölge Müdürlüğüne)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {RANKS.map((r) => {
                const isCurrent = r.level === rank.level;
                const isPast = r.level < rank.level;
                return (
                  <div
                    key={r.level}
                    className={`p-2 rounded border text-xs ${
                      isCurrent
                        ? 'bg-emerald-50 border-emerald-500'
                        : isPast
                          ? 'bg-sky-50 border-sky-300'
                          : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-[#0A2540]">
                      {r.level}. {r.title}
                    </div>
                    <div className="font-mono text-[11px] text-slate-600 mt-0.5">
                      {r.minXp} XP · Limit: {formatTRY(r.singleAuthLimit)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            <h3 className="text-xs font-bold text-[#0A2540] mb-2">
              Marmara Bölgesi Şube Koordinasyon Matrisi (Rütbe 5–6)
            </h3>
            {rank.level >= 5 ? (
              <div>
                <table className="w-full text-xs bg-white border border-slate-200 border-collapse mb-2">
                  <thead>
                    <tr className="bg-slate-100 text-[#0A2540]">
                      <th className="text-left p-1.5 border border-slate-200">Şube</th>
                      <th className="text-right p-1.5 border border-slate-200">Mevduat Hedef</th>
                      <th className="text-right p-1.5 border border-slate-200">Kasa Likidite</th>
                      <th className="text-right p-1.5 border border-slate-200">Denetim</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1.5 border border-slate-200">#034 Kadıköy Merkez</td>
                      <td className="p-1.5 border border-slate-200 text-right font-mono">%108</td>
                      <td className="p-1.5 border border-slate-200 text-right font-mono">
                        {formatTRY(cash)}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-right font-bold text-emerald-700">
                        Temiz
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-200">#012 Beşiktaş</td>
                      <td className="p-1.5 border border-slate-200 text-right font-mono">%96</td>
                      <td className="p-1.5 border border-slate-200 text-right font-mono">
                        3.450.000 ₺
                      </td>
                      <td className="p-1.5 border border-slate-200 text-right font-bold text-emerald-700">
                        Temiz
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-200">#058 Ataşehir Finans</td>
                      <td className="p-1.5 border border-slate-200 text-right font-mono">%114</td>
                      <td className="p-1.5 border border-slate-200 text-right font-mono">
                        8.900.000 ₺
                      </td>
                      <td className="p-1.5 border border-slate-200 text-right font-bold text-emerald-700">
                        A+
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={onRegionSync}
                  className="px-3 py-1.5 rounded bg-[#0A2540] hover:bg-[#143d66] text-white text-xs font-bold cursor-pointer"
                >
                  Bölge Likidite Dengesini Onayla (+35 XP)
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-600">
                5. Rütbe (Şube Müdürü · 700 XP) ve 6. Rütbe (Bölge Müdürü · 1000 XP) ile açılır.
              </div>
            )}
          </div>

          <div className="border border-slate-200 bg-slate-50 rounded-md p-3">
            <h3 className="text-xs font-bold text-[#0A2540] mb-2">
              Kesilen Dekont ve Denetim Geçmişi
            </h3>
            <div className="max-h-36 overflow-y-auto bg-white border border-slate-200">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[#0A2540]">
                    <th className="text-left p-1.5 border-b border-slate-200">Sıra</th>
                    <th className="text-left p-1.5 border-b border-slate-200">Müşteri</th>
                    <th className="text-left p-1.5 border-b border-slate-200">İşlem</th>
                    <th className="text-left p-1.5 border-b border-slate-200">Karar</th>
                    <th className="text-right p-1.5 border-b border-slate-200">Sonuç</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    [...logs].reverse().map((l, idx) => (
                      <tr key={`${l.ticket}-${idx}`} className="border-b border-slate-100">
                        <td className="p-1.5 font-mono">{l.ticket}</td>
                        <td className="p-1.5">{l.name}</td>
                        <td className="p-1.5">{l.op}</td>
                        <td className="p-1.5">{l.decision}</td>
                        <td
                          className={`p-1.5 text-right font-bold ${
                            l.ok ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {l.ok ? 'Doğru' : 'Hata'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-slate-500">
                        Henüz tamamlanan işlem yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
