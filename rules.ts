import type {
  CustomerScenario,
  DecisionAction,
  RankInfo,
  RejectReasonKey,
} from './types';

export const RANKS: RankInfo[] = [
  {
    level: 1,
    title: 'Gişe Yetkilisi',
    minXp: 0,
    deskPlate: 'MASA 01 · GİŞE YETKİLİSİ',
    singleAuthLimit: 150_000,
    summary: 'Nakit yatırma/çekme, kimlik-imza eşleştirme ve UV banknot taraması.',
  },
  {
    level: 2,
    title: 'Bireysel Müşteri Temsilcisi',
    minXp: 100,
    deskPlate: 'MASA 04 · BİREYSEL BANKACILIK',
    singleAuthLimit: 150_000,
    summary: 'İhtiyaç/taşıt kredileri, Findeks skoru ve KKB borç/gelir analizi.',
  },
  {
    level: 3,
    title: 'KOBİ Portföy Yöneticisi',
    minXp: 250,
    deskPlate: 'OFİS 02 · KOBİ VE TİCARİ',
    singleAuthLimit: 150_000,
    summary: 'Ticari çek karekod doğrulaması, bilanço rasyoları ve MASAK uyumu.',
  },
  {
    level: 4,
    title: 'Şube Operasyon Yönetmeni',
    minXp: 450,
    deskPlate: 'YÖNETİM · OPERASYON YETKİLİSİ',
    singleAuthLimit: 500_000,
    summary: 'Yüksek tutarlı işlem onayları, kriz yönetimi ve müfettiş denetimleri.',
  },
  {
    level: 5,
    title: 'Şube Müdürü',
    minXp: 700,
    deskPlate: 'MÜDÜRİYET · ŞUBE #034 KADIKÖY',
    singleAuthLimit: 20_000_000,
    summary: 'VIP mevduat pazarlıkları, şube hedef yönetimi ve tam imza yetkisi.',
  },
  {
    level: 6,
    title: 'Bölge Müdürü',
    minXp: 1000,
    deskPlate: 'MARMARA BÖLGE MÜDÜRLÜĞÜ',
    singleAuthLimit: 100_000_000,
    summary: 'Çoklu şube likidite koordinasyonu ve üst düzey kurumsal onaylar.',
  },
];

export const REJECT_REASONS: Array<{ key: RejectReasonKey; label: string }> = [
  { key: 'photo_mismatch', label: 'Kimlik fotoğrafı ile gişedeki kişi uyuşmuyor' },
  { key: 'expired_id', label: 'Kimlik belgesinin son geçerlilik tarihi dolmuş' },
  { key: 'sig_mismatch', label: 'Belgedeki imza Core Banking kaydıyla uyuşmuyor' },
  { key: 'fake_cash', label: 'Sahte banknot, hatalı kur veya belge tahrifatı tespit edildi' },
  { key: 'credit_risk', label: 'Yetersiz Findeks skoru, KKB gecikmesi veya gelir limiti aşımı' },
  { key: 'cheque_bad', label: 'Karşılıksız çek veya kritik şirket bilanço riski' },
  { key: 'scam_victim', label: 'Müşteri telefon dolandırıcılığı mağduru (Koruma reddi)' },
  { key: 'procedure_breach', label: 'Prosedür / KVKK ihlali (Vekaletsiz 3. şahıs bilgi talebi)' },
];

export const FX_RATES = [
  { code: 'USD/TRY', label: 'Amerikan Doları', buy: 34.2, sell: 34.85, spread: '%1.90' },
  { code: 'EUR/TRY', label: 'Euro', buy: 36.1, sell: 36.8, spread: '%1.93' },
  { code: 'GBP/TRY', label: 'İngiliz Sterlini', buy: 43.1, sell: 44.05, spread: '%2.20' },
  { code: 'XAU/TRY', label: 'Gram Altın', buy: 3045, sell: 3095, spread: '%1.64' },
];

export function formatTRY(amount: number): string {
  return `${new Intl.NumberFormat('tr-TR').format(Math.round(amount))} ₺`;
}

export function getCurrentRank(xp: number): RankInfo {
  let active = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXp) active = r;
  }
  return active;
}

export function getNextRank(xp: number): RankInfo | null {
  const current = getCurrentRank(xp);
  return RANKS.find((r) => r.level === current.level + 1) ?? null;
}

export interface LoanCalculation {
  monthlyPayment: number;
  totalDebtLoad: number;
  dtiPercent: number;
  isOverLimit: boolean;
}

export function calculateLoanInstallment(
  principal: number,
  months: number,
  monthlyRatePct: number,
  netIncome: number,
  existingDebt = 0
): LoanCalculation {
  const safePrincipal = Math.max(0, principal);
  const safeMonths = Math.max(1, months);
  const safeIncome = Math.max(1, netIncome);
  const r = Math.max(0.0001, monthlyRatePct / 100);
  const factor = Math.pow(1 + r, safeMonths);
  const monthlyPayment = Math.round((safePrincipal * r * factor) / (factor - 1));
  const totalDebtLoad = monthlyPayment + Math.max(0, existingDebt);
  const dtiPercent = Math.round((totalDebtLoad / safeIncome) * 100);
  return {
    monthlyPayment,
    totalDebtLoad,
    dtiPercent,
    isOverLimit: dtiPercent > 50,
  };
}

export function calculateFxReturn(rate: number, foreignAmount: number): number {
  return Math.round(Math.max(0, rate) * Math.max(0, foreignAmount));
}

export interface VaultBreakdownRow {
  label: string;
  unitValue: number | null;
  count: number | null;
  total: number;
}

export function calculateVaultDenominations(cashTotal: number): VaultBreakdownRow[] {
  const safeCash = Math.max(0, Math.round(cashTotal));
  const c200 = Math.floor((safeCash * 0.6) / 200);
  const c100 = Math.floor((safeCash * 0.25) / 100);
  const c50 = Math.floor((safeCash * 0.1) / 50);
  const accounted = c200 * 200 + c100 * 100 + c50 * 50;
  const remainder = safeCash - accounted;
  return [
    { label: '200 ₺ Banknot', unitValue: 200, count: c200, total: c200 * 200 },
    { label: '100 ₺ Banknot', unitValue: 100, count: c100, total: c100 * 100 },
    { label: '50 ₺ Banknot', unitValue: 50, count: c50, total: c50 * 50 },
    { label: '20 / 10 ₺ & Madeni', unitValue: null, count: null, total: remainder },
  ];
}

export function requiresDualApproval(
  scenario: CustomerScenario,
  action: DecisionAction,
  singleAuthLimit: number
): boolean {
  if (action !== 'approve') return false;
  if (!scenario.truth || scenario.truth.action !== 'approve') return false;
  return scenario.amount > singleAuthLimit;
}

export interface EvaluationOutcome {
  ok: boolean;
  xpDelta: number;
  satDelta: number;
  cashDelta: number;
  stamp: string;
  feedback: string;
}

export function evaluateCustomerDecision(
  scenario: CustomerScenario,
  action: DecisionAction,
  reasonKey: RejectReasonKey | null
): EvaluationOutcome {
  const truth = scenario.truth;
  const stamp =
    action === 'approve'
      ? 'ONAYLANDI'
      : action === 'masak'
        ? 'MASAK BİLDİRİLDİ'
        : 'REDDEDİLDİ';

  if (!truth) {
    return {
      ok: false,
      xpDelta: 0,
      satDelta: 0,
      cashDelta: 0,
      stamp,
      feedback: 'Bu senaryo diyalog seçeneği ile çözümlenmelidir.',
    };
  }

  let ok = false;
  if (action === truth.action) {
    ok = action === 'reject' ? reasonKey === truth.reason : true;
  }

  if (ok) {
    const isHighValueOrSpecial =
      action === 'masak' || scenario.amount > 150_000 || scenario.ticket.startsWith('D-');
    const xpDelta = isHighValueOrSpecial ? 75 : 45;
    return {
      ok: true,
      xpDelta,
      satDelta: 2,
      cashDelta: action === 'approve' ? scenario.cashDelta : 0,
      stamp,
      feedback: `DOĞRU KARAR (+${xpDelta} XP): ${truth.msg}`,
    };
  }

  const wrongReasonOnly = action === 'reject' && truth.action === 'reject';
  const feedback = wrongReasonOnly
    ? `İşlemi reddetmek doğruydu ancak yanlış gerekçe seçtiniz. Doğrusu: ${truth.msg}`
    : `DENETİM HATASI (-15 XP): ${truth.msg}`;

  return {
    ok: false,
    xpDelta: -15,
    satDelta: -8,
    cashDelta: 0,
    stamp,
    feedback,
  };
}
