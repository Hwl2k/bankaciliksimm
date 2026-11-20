import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { CoreTerminal } from './components/CoreTerminal';
import { CounterStage } from './components/CounterStage';
import {
  DualApprovalModal,
  PauseModal,
  PromotionModal,
  RejectModal,
} from './components/GameModals';
import { TitleScreen } from './components/TitleScreen';
import {
  evaluateCustomerDecision,
  formatTRY,
  getCurrentRank,
  getNextRank,
  requiresDualApproval,
} from './game/rules';
import { pickNextScenario } from './game/scenarios';
import type {
  AuditEntry,
  CustomerScenario,
  DecisionAction,
  DekontRecord,
  GamePhase,
  IntranetMessage,
  MasakEntry,
  PersistedProgress,
  RankInfo,
  RejectReasonKey,
  SpecialChoice,
  TabId,
} from './game/types';
import { bankAudio } from './utils/audio';

const STORAGE_KEY = 'aurabank_progress_v1';

const DEFAULT_INTRANET: IntranetMessage[] = [
  {
    id: 'init-1',
    sender: 'Genel Müdürlük',
    time: '09:00',
    kind: 'rate',
    text: 'Tek imza yetki limiti 150.000 ₺ tutarındadır. Üstündeki onaylı işlemlerde Çift İmza Onayı (OTP) alınız.',
  },
  {
    id: 'init-2',
    sender: 'Uyum ve Güvenlik',
    time: '09:05',
    kind: 'alert',
    text: 'Döviz işlemlerinde [405] kur tahtasını, KOBİ çeklerinde [512] karekod ekranını kontrol etmeyi unutmayın.',
  },
];

function loadSavedProgress(): PersistedProgress | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedProgress>;
    if (typeof parsed.xp !== 'number') return null;
    return {
      xp: parsed.xp,
      sat: typeof parsed.sat === 'number' ? parsed.sat : 92,
      errors: typeof parsed.errors === 'number' ? parsed.errors : 0,
      cash: typeof parsed.cash === 'number' ? parsed.cash : 1_250_000,
      queueCursor: typeof parsed.queueCursor === 'number' ? parsed.queueCursor : 0,
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      masakLogs: Array.isArray(parsed.masakLogs) ? parsed.masakLogs : [],
    };
  } catch {
    return null;
  }
}

export default function App() {
  const initialSaved = loadSavedProgress();
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [phase, setPhase] = useState<GamePhase>(autostart ? 'playing' : 'title');
  const [xp, setXp] = useState<number>(initialSaved?.xp ?? 0);
  const [sat, setSat] = useState<number>(initialSaved?.sat ?? 92);
  const [errors, setErrors] = useState<number>(initialSaved?.errors ?? 0);
  const [cash, setCash] = useState<number>(initialSaved?.cash ?? 1_250_000);
  const [queueCursor, setQueueCursor] = useState<number>(initialSaved?.queueCursor ?? 0);
  const [logs, setLogs] = useState<AuditEntry[]>(initialSaved?.logs ?? []);
  const [masakLogs, setMasakLogs] = useState<MasakEntry[]>(initialSaved?.masakLogs ?? []);

  const [activeTab, setActiveTab] = useState<TabId>('t101');
  const [customer, setCustomer] = useState<CustomerScenario | null>(null);
  const [lastDekont, setLastDekont] = useState<DekontRecord | null>(null);
  const [uvScanned, setUvScanned] = useState(false);
  const [dbQueried, setDbQueried] = useState(false);
  const [outageActive, setOutageActive] = useState(false);
  const [patience, setPatience] = useState(100);
  const [intranet, setIntranet] = useState<IntranetMessage[]>(DEFAULT_INTRANET);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [dualOpen, setDualOpen] = useState(false);
  const [dualOtp, setDualOtp] = useState('1923');
  const [promoRank, setPromoRank] = useState<RankInfo | null>(null);

  const [soundOn, setSoundOn] = useState(true);
  const [clockText, setClockText] = useState(() => new Date().toTimeString().slice(0, 8));
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const rank = getCurrentRank(xp);
  const nextRank = getNextRank(xp);

  const showToast = useCallback((msg: string, err = false) => {
    setToast({ msg, err });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4600);
  }, []);

  const pushIntranet = useCallback(
    (sender: string, text: string, kind: IntranetMessage['kind'] = 'info') => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setIntranet((prev) => [
        { id: `${Date.now()}-${Math.random()}`, sender, time, kind, text },
        ...prev.slice(0, 14),
      ]);
      bankAudio.play('msg');
    },
    []
  );

  // Sync body dataset state for testing and game shell hygiene
  useEffect(() => {
    document.body.dataset.state = phase;
  }, [phase]);

  // Persist progress automatically
  useEffect(() => {
    try {
      const payload: PersistedProgress = {
        xp,
        sat,
        errors,
        cash,
        queueCursor,
        logs,
        masakLogs,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [xp, sat, errors, cash, queueCursor, logs, masakLogs]);

  // Live clock
  useEffect(() => {
    const id = window.setInterval(() => {
      setClockText(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Gentle customer patience timer while active customer is waiting
  useEffect(() => {
    if (phase !== 'playing' || !customer) return;
    const id = window.setInterval(() => {
      setPatience((prev) => Math.max(15, prev - 1));
    }, 2500);
    return () => window.clearInterval(id);
  }, [phase, customer]);

  const applyXpDelta = useCallback(
    (delta: number) => {
      setXp((prevXp) => {
        const prevRank = getCurrentRank(prevXp);
        const nextXp = Math.max(0, prevXp + delta);
        const updatedRank = getCurrentRank(nextXp);
        if (updatedRank.level > prevRank.level) {
          bankAudio.play('promo');
          setPromoRank(updatedRank);
          pushIntranet(
            'İnsan Kaynakları',
            `Tebrikler! ${updatedRank.title} pozisyonuna terfi ettiniz.`,
            'rate'
          );
        }
        return nextXp;
      });
    },
    [pushIntranet]
  );

  const handleCallNext = useCallback(() => {
    if (customer || phase !== 'playing') return;
    const nextScenario = pickNextScenario(rank.level, queueCursor);
    setQueueCursor((c) => c + 1);
    setCustomer(nextScenario);
    setLastDekont(null);
    setUvScanned(false);
    setDbQueried(false);
    setPatience(100);
    setOutageActive(nextScenario.eventType === 'outage');
    setActiveTab('t101');
    bankAudio.play('ding');
  }, [customer, phase, rank.level, queueCursor]);

  const finalizeDecision = useCallback(
    (action: DecisionAction, reasonKey: RejectReasonKey | null = null) => {
      if (!customer) return;
      const outcome = evaluateCustomerDecision(customer, action, reasonKey);
      const ref = Math.floor(100_000 + Math.random() * 899_999);

      if (outcome.ok) {
        bankAudio.play('ok');
        setSat((s) => Math.min(100, s + outcome.satDelta));
        if (outcome.cashDelta !== 0) setCash((c) => c + outcome.cashDelta);
        if (action === 'masak') {
          const now = new Date().toTimeString().slice(0, 5);
          setMasakLogs((prev) => [
            { ticket: customer.ticket, name: customer.name, amount: customer.amount, time: now },
            ...prev,
          ]);
        }
        applyXpDelta(outcome.xpDelta);
        showToast(outcome.feedback, false);
      } else {
        bankAudio.play('err');
        setErrors((e) => e + 1);
        setSat((s) => Math.max(0, s + outcome.satDelta));
        applyXpDelta(outcome.xpDelta);
        showToast(outcome.feedback, true);
      }

      setLastDekont({
        ref,
        name: customer.name,
        ticket: customer.ticket,
        op: customer.op,
        amount: customer.amount,
        stamp: outcome.stamp,
        ok: outcome.ok,
        feedback: outcome.feedback,
        officerTitle: rank.title,
      });
      setLogs((prev) => [
        ...prev,
        {
          ticket: customer.ticket,
          name: customer.name,
          op: customer.op,
          decision: outcome.stamp,
          ok: outcome.ok,
        },
      ]);
      setCustomer(null);
      setOutageActive(false);
      setRejectOpen(false);
      setDualOpen(false);
    },
    [customer, rank.title, applyXpDelta, showToast]
  );

  const handleSpecialChoice = useCallback(
    (choice: SpecialChoice) => {
      if (!customer) return;
      if (choice.ok) {
        bankAudio.play('ok');
        setSat((s) => Math.min(100, s + 4));
        if (customer.cashDelta !== 0) setCash((c) => c + customer.cashDelta);
        applyXpDelta(choice.xp);
        showToast(`${choice.feedback} (+${choice.xp} XP)`, false);
      } else {
        bankAudio.play('err');
        setErrors((e) => e + 1);
        setSat((s) => Math.max(0, s - 10));
        applyXpDelta(choice.xp);
        showToast(`${choice.feedback} (${choice.xp} XP)`, true);
      }

      const ref = Math.floor(100_000 + Math.random() * 899_999);
      setLastDekont({
        ref,
        name: customer.name,
        ticket: customer.ticket,
        op: customer.op,
        amount: customer.amount,
        stamp: choice.ok ? 'ÇÖZÜMLENDİ' : 'OLUMSUZ',
        ok: choice.ok,
        feedback: choice.feedback,
        officerTitle: rank.title,
      });
      setLogs((prev) => [
        ...prev,
        {
          ticket: customer.ticket,
          name: customer.name,
          op: customer.op,
          decision: choice.ok ? 'ÇÖZÜM' : 'HATA',
          ok: choice.ok,
        },
      ]);
      setCustomer(null);
      setOutageActive(false);
    },
    [customer, rank.title, applyXpDelta, showToast]
  );

  const handleApproveClick = useCallback(() => {
    if (!customer) return;
    if (requiresDualApproval(customer, 'approve', rank.singleAuthLimit)) {
      const code = String(Math.floor(1000 + Math.random() * 8999));
      setDualOtp(code);
      setDualOpen(true);
      return;
    }
    finalizeDecision('approve');
  }, [customer, rank.singleAuthLimit, finalizeDecision]);

  const handleStartNew = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setXp(0);
    setSat(92);
    setErrors(0);
    setCash(1_250_000);
    setQueueCursor(0);
    setLogs([]);
    setMasakLogs([]);
    setCustomer(null);
    setLastDekont(null);
    setOutageActive(false);
    setIntranet(DEFAULT_INTRANET);
    setActiveTab('t101');
    setPhase('playing');
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setPhase('playing');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (initialSaved && initialSaved.xp > 0) handleContinue();
          else handleStartNew();
        }
        return;
      }

      if (e.key === 'Escape' || (e.key.toLowerCase() === 'p' && !['INPUT', 'SELECT', 'TEXTAREA'].includes((document.activeElement?.tagName || '')))) {
        if (rejectOpen) {
          setRejectOpen(false);
          return;
        }
        if (dualOpen) {
          setDualOpen(false);
          return;
        }
        if (promoRank) {
          setPromoRank(null);
          return;
        }
        setPhase((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        return;
      }

      if (phase !== 'playing') return;

      if (e.key === 'F9') {
        e.preventDefault();
        handleCallNext();
        return;
      }

      if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        const tabIds: TabId[] = ['t101', 't204', 't310', 't405', 't512', 't608', 't720', 't850'];
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < tabIds.length) {
          setActiveTab(tabIds[idx]);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    phase,
    initialSaved,
    rejectOpen,
    dualOpen,
    promoRank,
    handleContinue,
    handleStartNew,
    handleCallNext,
  ]);

  if (phase === 'title') {
    const savedRank = getCurrentRank(xp);
    return (
      <TitleScreen
        hasSavedProgress={xp > 0 || logs.length > 0}
        savedRankTitle={savedRank.title}
        savedXp={xp}
        onStartNew={handleStartNew}
        onContinue={handleContinue}
      />
    );
  }

  const xpPercent = nextRank
    ? Math.min(100, Math.round(((xp - rank.minXp) / (nextRank.minXp - rank.minXp)) * 100))
    : 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#DDE3EA]">
      {/* Core Terminal Top Bar */}
      <header className="bg-[#0A2540] text-white px-4 py-2.5 border-b-2 border-emerald-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center font-display font-extrabold text-sm text-white">
            AB
          </div>
          <div>
            <div className="font-display font-bold text-sm leading-tight whitespace-nowrap">
              AuraBank · Şube #034 Kadıköy
            </div>
            <div className="font-mono text-[11px] text-slate-300 whitespace-nowrap">
              20.11.2026 · {clockText}
            </div>
          </div>
        </div>

        {/* Live Career & Branch HUD */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[#113355] border border-emerald-500/45 rounded px-3 py-1.5 min-w-[210px]">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-100 gap-3">
              <span className="whitespace-nowrap">
                {rank.level}. {rank.title}
              </span>
              <span className="font-mono whitespace-nowrap">
                {nextRank ? `${xp} / ${nextRank.minXp} XP` : `${xp} XP`}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white/10 border border-white/15 rounded px-2.5 py-1 text-xs">
            <div className="text-[10px] text-slate-300">Memnuniyet</div>
            <div
              className={`font-mono font-bold ${
                sat >= 75 ? 'text-emerald-300' : sat >= 50 ? 'text-amber-300' : 'text-red-300'
              }`}
            >
              %{sat}
            </div>
          </div>

          <div className="bg-white/10 border border-white/15 rounded px-2.5 py-1 text-xs">
            <div className="text-[10px] text-slate-300">Denetim</div>
            <div
              className={`font-mono font-bold ${
                errors === 0 ? 'text-emerald-300' : 'text-red-300'
              }`}
            >
              {errors} Hata
            </div>
          </div>

          <div className="bg-white/10 border border-white/15 rounded px-2.5 py-1 text-xs">
            <div className="text-[10px] text-slate-300">Şube Kasası</div>
            <div className="font-mono font-bold text-white">{formatTRY(cash)}</div>
          </div>
        </div>

        {/* Compact Utility Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            tabIndex={-1}
            aria-label={soundOn ? 'Sesi kapat' : 'Sesi aç'}
            onClick={(e) => {
              e.currentTarget.blur();
              const next = !soundOn;
              bankAudio.enabled = next;
              setSoundOn(next);
            }}
            className="p-2 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer"
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Vardiyayı duraklat"
            onClick={(e) => {
              e.currentTarget.blur();
              setPhase('paused');
            }}
            className="p-2 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer"
          >
            <Pause className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Kariyeri sıfırla"
            onClick={(e) => {
              e.currentTarget.blur();
              handleStartNew();
              showToast('Kariyer sıfırlandı. Sıramatikten ilk müşteriyi çağırabilirsiniz.', false);
            }}
            className="p-2 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* System Outage Alert Banner */}
      {outageActive && (
        <div className="bg-amber-100 border-b border-amber-400 text-amber-950 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <span>
            Core Banking sunucusunda yüksek gecikme uyarısı: Müşteriyi diyalogla sakinleştirin ve
            yedek sunucuya geçin.
          </span>
          <button
            type="button"
            onClick={() => {
              setOutageActive(false);
              pushIntranet('IT Destek', 'Yedek Core Banking sunucusuna geçiş tamamlandı.', 'rate');
              showToast('Yedek sunucuya geçildi. Şimdi müşteriye yanıt veriniz.', false);
            }}
            className="px-3 py-1 rounded bg-[#0A2540] text-white font-bold cursor-pointer"
          >
            Yedek Sunucuya Geç
          </button>
        </div>
      )}

      {/* Main Split Workstation */}
      <main className="flex-1 max-w-[1540px] w-full mx-auto p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <CounterStage
            customer={customer}
            rank={rank}
            queueCount={12 + (queueCursor % 5)}
            patience={patience}
            hasLastDekont={Boolean(lastDekont)}
            intranet={intranet}
            onCallNext={handleCallNext}
            onSpecialChoice={handleSpecialChoice}
          />
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <CoreTerminal
            activeTab={activeTab}
            onTabChange={setActiveTab}
            customer={customer}
            lastDekont={lastDekont}
            rank={rank}
            cash={cash}
            uvScanned={uvScanned}
            dbQueried={dbQueried}
            logs={logs}
            masakLogs={masakLogs}
            onScanUv={() => {
              setUvScanned(true);
              bankAudio.play('msg');
            }}
            onFetchActiveDb={() => {
              if (!customer) {
                showToast('Önce Sıramatikten bir müşteri çağırın.', true);
                return;
              }
              setDbQueried(true);
              bankAudio.play('msg');
            }}
            onQueryTckn={(input) => {
              if (!customer) return;
              if (input.trim() === customer.tckn) {
                setDbQueried(true);
                bankAudio.play('msg');
              } else {
                showToast('Girilen TCKN gişedeki müşteriyle eşleşmiyor.', true);
              }
            }}
            onApprove={handleApproveClick}
            onOpenReject={() => setRejectOpen(true)}
            onMasakReport={() => finalizeDecision('masak')}
            onVaultReconcile={() => {
              applyXpDelta(15);
              bankAudio.play('ok');
              showToast('Gişe fiziki kasa mutabakatı doğrulandı (+15 XP).', false);
            }}
            onRegionSync={() => {
              applyXpDelta(35);
              pushIntranet(
                'Bölge Müdürlüğü',
                'Marmara Bölgesi şube likidite dağılımı onaylandı.',
                'rate'
              );
              showToast('Bölge koordinasyon onayı verildi (+35 XP).', false);
            }}
          />
        </div>
      </main>

      {/* Modals */}
      <RejectModal
        open={rejectOpen}
        onSelectReason={(key) => finalizeDecision('reject', key)}
        onClose={() => setRejectOpen(false)}
      />

      <DualApprovalModal
        open={dualOpen}
        customer={customer}
        rank={rank}
        expectedCode={dualOtp}
        onRequestOtp={() => {
          if (!customer) return;
          pushIntranet(
            'Şube Operasyon Yönetmeni',
            `#${customer.ticket} yüksek tutarlı işlem için Tek Kullanımlık Onay Kodunuz: ${dualOtp}`,
            'rate'
          );
          showToast(`Onay kodu AuraNet üzerinden iletildi: ${dualOtp}`, false);
        }}
        onConfirm={() => finalizeDecision('approve')}
        onClose={() => setDualOpen(false)}
      />

      <PromotionModal rank={promoRank} onClose={() => setPromoRank(null)} />

      <PauseModal
        open={phase === 'paused'}
        xp={xp}
        rank={rank}
        sat={sat}
        errors={errors}
        onResume={() => setPhase('playing')}
        onRestart={() => {
          handleStartNew();
          showToast('Kariyer sıfırlandı.', false);
        }}
        onExitTitle={() => setPhase('title')}
      />

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-16 right-4 z-50 max-w-md rounded-md px-4 py-3 text-xs font-medium shadow-lg border ${
            toast.err
              ? 'bg-red-950 text-red-50 border-red-500'
              : 'bg-[#0A2540] text-white border-emerald-500'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
