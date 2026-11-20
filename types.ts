export type GamePhase = 'title' | 'playing' | 'paused';

export type TabId = 't101' | 't204' | 't310' | 't405' | 't512' | 't608' | 't720' | 't850';

export type SignatureStyle = 'loop' | 'sharp' | 'wave' | 'slash';

export type DecisionAction = 'approve' | 'reject' | 'masak';

export type RejectReasonKey =
  | 'photo_mismatch'
  | 'expired_id'
  | 'sig_mismatch'
  | 'fake_cash'
  | 'credit_risk'
  | 'cheque_bad'
  | 'scam_victim'
  | 'procedure_breach';

export interface RankInfo {
  level: number;
  title: string;
  minXp: number;
  deskPlate: string;
  singleAuthLimit: number;
  summary: string;
}

export interface SpecialChoice {
  label: string;
  ok: boolean;
  xp: number;
  feedback: string;
}

export interface ChequeInfo {
  drawer: string;
  qrStatus: string;
  currentRatio: string;
  debtEquity: string;
}

export interface CustomerScenario {
  id: string;
  ticket: string;
  minRank: number;
  tag: string;
  eventType?: 'outage' | 'vip' | 'scam' | 'inspector';
  name: string;
  tckn: string;
  dob: string;
  exp: string;
  photo: string;
  idPhoto: string;
  sig: SignatureStyle;
  coreSig: SignatureStyle;
  iban: string;
  balance: number;
  blacklist?: boolean;
  dialogue: string;
  op: string;
  amount: number;
  cashDelta: number;
  docTitle: string;
  docRows: Array<[string, string]>;
  hasUv: boolean;
  uvValid?: boolean;
  findeks: number;
  kkb: string[];
  income: number;
  debt: number;
  chequeInfo?: ChequeInfo;
  choices?: SpecialChoice[];
  truth?: {
    action: DecisionAction;
    reason: RejectReasonKey | null;
    msg: string;
  };
}

export interface DekontRecord {
  ref: number;
  name: string;
  ticket: string;
  op: string;
  amount: number;
  stamp: string;
  ok: boolean;
  feedback: string;
  officerTitle: string;
}

export interface AuditEntry {
  ticket: string;
  name: string;
  op: string;
  decision: string;
  ok: boolean;
}

export interface MasakEntry {
  ticket: string;
  name: string;
  amount: number;
  time: string;
}

export interface IntranetMessage {
  id: string;
  sender: string;
  time: string;
  kind: 'info' | 'rate' | 'alert';
  text: string;
}

export interface PersistedProgress {
  xp: number;
  sat: number;
  errors: number;
  cash: number;
  queueCursor: number;
  logs: AuditEntry[];
  masakLogs: MasakEntry[];
}
