import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRecords } from '../lib/records';
import {
  PRICE_PER_TREE_ZMW,
  SURVIVAL_THRESHOLD,
  trancheAmounts,
  evaluateTranche,
} from '../lib/tranches';
import { PROVIDERS, simulateMobileMoney } from '../lib/mobileMoney';

const CHECKPOINTS = [0, 12, 24, 36];
const DEFAULT_PHONE = '260 977 123 456';

function makeDemoRecords() {
  const now = Date.now();
  const daysAgo = (n) => new Date(now - n * 86400000).toISOString();
  return [
    {
      id: 'demo-makeni',
      isDemo: true,
      community: 'Makeni, Lusaka',
      tree_count: 500,
      verified_at: daysAgo(40),
      location: '−15.387, 28.323',
    },
    {
      id: 'demo-chibombo',
      isDemo: true,
      community: 'Chibombo, Central',
      tree_count: 320,
      verified_at: daysAgo(120),
      location: '−14.656, 28.071',
    },
    {
      id: 'demo-sinda',
      isDemo: true,
      community: 'Sinda, Eastern',
      tree_count: 210,
      verified_at: daysAgo(200),
      location: '−13.388, 32.653',
    },
  ];
}

export default function PayoutSimulator() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const [pricePerTree, setPricePerTree] = useState(PRICE_PER_TREE_ZMW);
  const [elapsedMonths, setElapsedMonths] = useState(0);
  const [survivalAt12, setSurvivalAt12] = useState(90);
  const [survivalAt24, setSurvivalAt24] = useState(85);
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [phone, setPhone] = useState(DEFAULT_PHONE);

  const [payments, setPayments] = useState({});
  const [processingIndex, setProcessingIndex] = useState(null);
  const [stageMessage, setStageMessage] = useState(null);

  useEffect(() => {
    (async () => {
      let merged = makeDemoRecords();
      try {
        const mine = await getMyRecords();
        const verified = (mine || [])
          .filter((r) => r.status === 'verified')
          .map((r) => ({
            id: r.id,
            isDemo: false,
            community: r.community,
            tree_count: r.tree_count,
            verified_at: r.reviewed_at || r.created_at,
            location: `${r.gps_lat}, ${r.gps_lng}`,
          }));
        merged = [...merged, ...verified];
      } catch {
        // demo records only if Supabase read fails
      }
      setRecords(merged);
      setSelectedId(merged[0]?.id ?? null);
      setLoading(false);
    })();
  }, []);

  const record = records.find((r) => r.id === selectedId);

  const schedule = useMemo(
    () => (record ? trancheAmounts(record.tree_count, pricePerTree) : []),
    [record, pricePerTree]
  );

  const statuses = useMemo(
    () =>
      schedule.map((t) =>
        evaluateTranche(t, { elapsedMonths, survivalAt12, survivalAt24 })
      ),
    [schedule, elapsedMonths, survivalAt12, survivalAt24]
  );

  const summary = useMemo(() => {
    let paid = 0;
    let ready = 0;
    let locked = 0;
    let notMet = 0;
    schedule.forEach((t, i) => {
      const st = statuses[i];
      if (payments[t.index]) paid += t.amount;
      else if (st === 'released') ready += t.amount;
      else if (st === 'not-met') notMet += t.amount;
      else locked += t.amount;
    });
    return { paid, ready, locked, notMet };
  }, [schedule, statuses, payments]);

  const resetSimulation = () => {
    setPayments({});
    setElapsedMonths(0);
    setProcessingIndex(null);
    setStageMessage(null);
  };

  const handleSelectRecord = (id) => {
    setSelectedId(id);
    resetSimulation();
  };

  const addSampleRecord = () => {
    const communities = [
      ['Mumbwa, Central', 240],
      ['Katete, Eastern', 150],
      ['Kitwe, Copperbelt', 400],
      ['Senanga, Western', 180],
    ];
    const [community, count] =
      communities[Math.floor(Math.random() * communities.length)];
    const rec = {
      id: `demo-${Date.now()}`,
      isDemo: true,
      community,
      tree_count: count,
      verified_at: new Date().toISOString(),
      location: '−15.387, 28.323',
    };
    setRecords((prev) => [rec, ...prev]);
    handleSelectRecord(rec.id);
  };

  const nextCheckpoint = () => {
    const next = CHECKPOINTS.find((c) => c > elapsedMonths);
    setElapsedMonths(next ?? CHECKPOINTS[CHECKPOINTS.length - 1]);
  };

  const handlePay = async (tranche) => {
    setProcessingIndex(tranche.index);
    setStageMessage(null);
    try {
      const result = await simulateMobileMoney(
        { provider, phone, amount: tranche.amount },
        setStageMessage
      );
      setPayments((prev) => ({
        ...prev,
        [tranche.index]: { ...result, trancheLabel: tranche.label },
      }));
    } finally {
      setProcessingIndex(null);
      setStageMessage(null);
    }
  };

  const narrator = useMemo(() => {
    if (elapsedMonths < 12) {
      return `Site is at month ${elapsedMonths} — before its first survival check. Tranche 1 (50%) was released at verification and is ready to pay. Set the survival % below and advance the timeline to month 12+ to trigger Tranche 2.`;
    }
    if (elapsedMonths < 24) {
      const met = survivalAt12 >= SURVIVAL_THRESHOLD * 100;
      return `At month ${elapsedMonths}, the 12-month check reports ${survivalAt12}% survival — ${
        met ? 'threshold met, so Tranche 2 (30%) is ready to pay.' : 'below the 70% threshold, so Tranche 2 (30%) is blocked.'
      } Advance to month 24+ for the final check.`;
    }
    const met = survivalAt24 >= SURVIVAL_THRESHOLD * 100;
    return `At month ${elapsedMonths}, the 24-month check reports ${survivalAt24}% survival — ${
      met ? 'threshold met, so Tranche 3 (20%) is ready to pay.' : 'below the 70% threshold, so Tranche 3 (20%) is blocked.'
    }`;
  }, [elapsedMonths, survivalAt12, survivalAt24]);

  const payoutLog = useMemo(
    () =>
      Object.values(payments)
        .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1)),
    [payments]
  );

  if (loading) return <div className="page"><p>Loading…</p></div>;

  return (
    <div className="page">
      <h1>Payout Simulator</h1>
      <p className="page-subtitle">
        In-memory demo of the 50/30/20 tranche payout flow — nothing is written to
        the ledger. Use sample records or your own verified ones from{' '}
        <Link to="/my-records">My Records</Link>.
      </p>

      <div className="sim-layout">
        <aside className="sim-card">
          <h2 className="sim-card-title">Simulation controls</h2>

          <div className="sim-field">
            <label htmlFor="record-select">Planting record</label>
            <select
              id="record-select"
              value={selectedId ?? ''}
              onChange={(e) => handleSelectRecord(e.target.value)}
            >
              {records.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.community} · {r.tree_count} trees{r.isDemo ? ' (sample)' : ''}
                </option>
              ))}
            </select>
            <button className="btn-small sim-add-sample" onClick={addSampleRecord}>
              + New sample record
            </button>
          </div>

          <div className="sim-field">
            <label htmlFor="price-input">Credit value (ZMW / tree)</label>
            <input
              id="price-input"
              type="number"
              min="1"
              value={pricePerTree}
              onChange={(e) => setPricePerTree(Number(e.target.value) || 0)}
            />
          </div>

          <div className="sim-slider-row">
            <div className="sim-slider-head">
              <label htmlFor="survival12">12-month survival</label>
              <span>{survivalAt12}%</span>
            </div>
            <input
              id="survival12"
              type="range"
              min="0"
              max="100"
              value={survivalAt12}
              onChange={(e) => setSurvivalAt12(Number(e.target.value))}
            />
          </div>

          <div className="sim-slider-row">
            <div className="sim-slider-head">
              <label htmlFor="survival24">24-month survival</label>
              <span>{survivalAt24}%</span>
            </div>
            <input
              id="survival24"
              type="range"
              min="0"
              max="100"
              value={survivalAt24}
              onChange={(e) => setSurvivalAt24(Number(e.target.value))}
            />
          </div>

          <div className="sim-field">
            <label htmlFor="time-slider">
              Time since verification — month {elapsedMonths}
            </label>
            <input
              id="time-slider"
              type="range"
              min="0"
              max="36"
              step="1"
              value={elapsedMonths}
              onChange={(e) => setElapsedMonths(Number(e.target.value))}
            />
            <div className="milestone-buttons">
              {CHECKPOINTS.map((c) => (
                <button
                  key={c}
                  className={`btn-small milestone-btn${elapsedMonths >= c ? ' is-reached' : ''}`}
                  onClick={() => setElapsedMonths(c)}
                >
                  M{c}
                </button>
              ))}
              <button className="btn-small btn-next-step" onClick={nextCheckpoint}>
                Advance ▸
              </button>
            </div>
          </div>

          <div className="sim-field">
            <label htmlFor="provider-select">Mobile money provider</label>
            <select
              id="provider-select"
              value={provider.id}
              onChange={(e) =>
                setProvider(PROVIDERS.find((p) => p.id === e.target.value))
              }
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sim-field">
            <label htmlFor="phone-input">Recipient wallet</label>
            <input
              id="phone-input"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button className="btn-primary sim-reset" onClick={resetSimulation}>
            Reset simulation
          </button>

          <div className="sim-narrator">{narrator}</div>
        </aside>

        <section className="sim-main">
          {record && (
            <div className="sim-card">
              <div className="sim-record-head">
                <div>
                  <h2 className="sim-card-title">{record.community}</h2>
                  <p className="sim-record-meta">
                    {record.tree_count} trees · verified{' '}
                    {new Date(record.verified_at).toLocaleDateString()} ·{' '}
                    {record.location}
                  </p>
                </div>
                <div className="sim-total">
                  <span>Total credit value</span>
                  <b>ZMW {summary.paid + summary.ready + summary.locked + summary.notMet}</b>
                </div>
              </div>

              <div className="sim-summary">
                <div className="sim-stat is-paid"><b>ZMW {summary.paid}</b><span>Paid</span></div>
                <div className="sim-stat is-ready"><b>ZMW {summary.ready}</b><span>Ready</span></div>
                <div className="sim-stat is-locked"><b>ZMW {summary.locked}</b><span>Pending</span></div>
                <div className="sim-stat is-not-met"><b>ZMW {summary.notMet}</b><span>Not met</span></div>
              </div>

              <div className="tranche-timeline">
                {schedule.map((t, i) => {
                  const st = statuses[i];
                  const paid = payments[t.index];
                  const cls = paid
                    ? 'is-paid'
                    : st === 'not-met'
                      ? 'is-not-met'
                      : st === 'locked'
                        ? 'is-locked'
                        : 'is-released';
                  const badge =
                    paid ? 'PAID'
                      : st === 'not-met' ? 'NOT MET'
                        : st === 'locked' ? 'PENDING' : 'READY';
                  const survival = t.index === 2 ? survivalAt12 : survivalAt24;
                  return (
                    <div key={t.index} className={`tranche-card ${cls}`}>
                      <div className="tranche-head">
                        <span className="tranche-title">Tranche {t.index}</span>
                        <span className={`status-badge ${cls}`}>{badge}</span>
                      </div>
                      <div className="tranche-amount">ZMW {t.amount.toLocaleString()}</div>
                      <div className="tranche-pct">{Math.round(t.pct * 100)}% of total</div>
                      <div className="tranche-milestone">
                        {t.survivalCheck
                          ? `M${t.survivalCheck} · ${t.requirement}`
                          : `M0 · ${t.requirement}`}
                      </div>
                      {t.survivalCheck && (
                        <div className={`tranche-survival ${survival >= SURVIVAL_THRESHOLD * 100 ? 'met' : 'failed'}`}>
                          {st === 'locked'
                            ? `Check at M${t.survivalCheck}`
                            : `${survival}% survival — ${survival >= SURVIVAL_THRESHOLD * 100 ? 'threshold met' : 'threshold not met'}`}
                        </div>
                      )}
                      {paid ? (
                        <div className="tranche-paid">
                          <span>Paid {new Date(paid.timestamp).toLocaleTimeString()}</span>
                          <span className="tranche-ref">{paid.reference}</span>
                          <span className="tranche-route">{paid.provider} → {paid.phone}</span>
                        </div>
                      ) : st === 'released' ? (
                        <button
                          className="btn-primary pay-button"
                          disabled={processingIndex !== null}
                          onClick={() => handlePay(t)}
                        >
                          {processingIndex === t.index
                            ? stageMessage || 'Paying…'
                            : `Pay via ${provider.label}`}
                        </button>
                      ) : (
                        <div className="tranche-blocked">
                          {st === 'not-met'
                            ? 'Survival threshold not met — tranche withheld.'
                            : 'Unlocks after the survival check.'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="sim-card sim-payout-log">
            <h2 className="sim-card-title">Payout trail</h2>
            {payoutLog.length === 0 ? (
              <div className="placeholder-box">
                No payouts sent yet. Release a tranche to see the mobile money trail
                appear here.
              </div>
            ) : (
              <table className="review-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tranche</th>
                    <th>Amount (ZMW)</th>
                    <th>Provider</th>
                    <th>Wallet</th>
                    <th>Ref</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutLog.map((p, idx) => (
                    <tr key={p.reference}>
                      <td>{idx + 1}</td>
                      <td>{p.trancheLabel}</td>
                      <td>{p.amount.toLocaleString()}</td>
                      <td>{p.provider}</td>
                      <td>{p.phone}</td>
                      <td>{p.reference}</td>
                      <td>{new Date(p.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
