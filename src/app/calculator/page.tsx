'use client';
import { useState, useCallback, useMemo } from 'react';

// ─── Excise rate table ────────────────────────────────────────────────────────
const EXCISE: Record<string, Record<string, number>> = {
  Petrol:   { '<=1600': 46.95, '1601-1799': 62.77, '>=1800': 62.77 },
  Diesel:   { '<=2000': 46.95, '2001-2500': 62.77, '>2500': 62.77 },
  Hybrid:   { '<=1600': 20,    '1601-1799': 35,    '1800-1999': 46.95, '>=2000': 62.77 },
  Electric: { 'N/A': 10 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function bds(n: number) {
  return n.toLocaleString('en-BB', { style: 'currency', currency: 'BBD', minimumFractionDigits: 2 });
}

function p(v: string) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

// ─── Default form state ───────────────────────────────────────────────────────
const INIT = {
  vendorUsd:    '0',
  pmt1Usd:      '0',
  wireUsd:      '0',
  bankFxRate:   '2.02768',
  bankFxPct:    '2',
  bankFixedBds: '105',
  numPmts:      '2',
  notes:        '',
  declUsd:      '0',
  declFxRate:   '2',
  declFxPct:    '0',
  freightUsd:   '0',
  bodyType:     'Car',
  engineType:   'Petrol',
  ccBracket:    '<=1600',
  vatPct:       '17.5',
  procFee:      '10',
  carDuty:      '45',
  hybDisc:      '10',
  pickupDuty:   '10',
};

type FormState = typeof INIT;

// ─── Calculations ─────────────────────────────────────────────────────────────
function calcBank(f: FormState) {
  const vendor = p(f.vendorUsd);
  const pmt1   = p(f.pmt1Usd);
  const pmt2   = Math.max(vendor - pmt1, 0);
  const wire   = p(f.wireUsd);
  const rate   = p(f.bankFxRate);
  const fxPct  = p(f.bankFxPct) / 100;
  const fixed  = p(f.bankFixedBds);
  const n      = parseInt(f.numPmts) || 2;
  const pmts   = n === 1 ? [vendor] : [pmt1, pmt2];

  let totalBds = 0, baseBds = 0;
  pmts.forEach(amt => {
    const converted = (amt + wire) * rate;
    baseBds  += converted;
    totalBds += converted * (1 + fxPct) + fixed;
  });

  return { pmt2, totalBds, feesBds: totalBds - baseBds };
}

function calcDeclaration(f: FormState) {
  const declaredUsd  = p(f.declUsd);
  const rate         = p(f.declFxRate);
  const fxMult       = 1 + p(f.declFxPct) / 100;
  const freightUsd   = p(f.freightUsd);

  const declaredBds  = declaredUsd  * rate * fxMult;
  const freightBds   = freightUsd   * rate * fxMult;
  const customsValue = declaredBds > 0 ? declaredBds + freightBds : 0;

  // Import duty rate
  const carDuty    = p(f.carDuty);
  const pickupDuty = p(f.pickupDuty);
  const hybDisc    = p(f.hybDisc);
  let idr = 0;
  if (f.bodyType === 'Pickup')       idr = pickupDuty / 100;
  else if (f.engineType === 'Electric') idr = 0;
  else if (f.engineType === 'Hybrid')   idr = Math.max(carDuty - hybDisc, 0) / 100;
  else                               idr = carDuty / 100;

  const importDuty  = customsValue * idr;
  const excR        = (EXCISE[f.engineType]?.[f.ccBracket] ?? 0) / 100;
  const exciseBase  = customsValue + importDuty;
  const excise      = exciseBase * excR;
  const vatPct      = p(f.vatPct) / 100;
  const vat         = (exciseBase + excise) * vatPct;
  const proc        = customsValue > 0 ? p(f.procFee) : 0;

  const dutiesTotal = importDuty + excise + vat + proc;
  return {
    declaredBds, freightBds, customsValue,
    idr, importDuty,
    excR, excise,
    vatPct, vat,
    proc, dutiesTotal,
    declTotal: customsValue + dutiesTotal,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CalculatorPage() {
  const [f, setF] = useState<FormState>(INIT);
  const [saved, setSaved] = useState(false);

  const set = useCallback((k: keyof FormState, v: string) => {
    setF(prev => ({ ...prev, [k]: v }));
    setSaved(false);
  }, []);

  // Recompute CC options when engine changes
  const ccOptions = useMemo(() => Object.keys(EXCISE[f.engineType] ?? {}), [f.engineType]);

  const bank = useMemo(() => calcBank(f), [f]);
  const decl = useMemo(() => calcDeclaration(f), [f]);

  const declWarn = p(f.vendorUsd) > 0 && p(f.declUsd) === 0;

  // Save deal to localStorage
  function saveDeal() {
    try {
      const deal = {
        ts: new Date().toISOString(),
        notes: f.notes,
        vendor_usd: p(f.vendorUsd),
        pmt1_usd: p(f.pmt1Usd),
        pmt2_usd: bank.pmt2,
        wire_usd: p(f.wireUsd),
        bank_fxrate: p(f.bankFxRate),
        bank_fx_pct: p(f.bankFxPct),
        bank_fixed_bds: p(f.bankFixedBds),
        num_pmts: parseInt(f.numPmts),
        bank_total_bds: bank.totalBds,
        bank_fees_bds: bank.feesBds,
        decl_usd: p(f.declUsd),
        decl_fxrate: p(f.declFxRate),
        decl_fx_pct: p(f.declFxPct),
        freight_usd: p(f.freightUsd),
        body_type: f.bodyType,
        engine_type: f.engineType,
        cc_bracket: f.ccBracket,
        vat_pct: p(f.vatPct),
        proc_fee: p(f.procFee),
        car_duty: p(f.carDuty),
        hyb_disc: p(f.hybDisc),
        pickup_duty: p(f.pickupDuty),
        declared_bds: decl.declaredBds,
        freight_bds: decl.freightBds,
        customs_value_bds: decl.customsValue,
        import_duty_rate: decl.idr,
        import_duty_bds: decl.importDuty,
        excise_rate: decl.excR,
        excise_bds: decl.excise,
        vat_bds: decl.vat,
        duties_total_bds: decl.dutiesTotal,
        declaration_total_bds: decl.declTotal,
      };
      const key = 'motorbros_vehiclecalc_deals_v2';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.unshift(deal);
      localStorage.setItem(key, JSON.stringify(list));
      setSaved(true);
    } catch {
      alert('Failed to save deal.');
    }
  }

  function exportDeals() {
    const key = 'motorbros_vehiclecalc_deals_v2';
    let list: Record<string, unknown>[];
    try {
      list = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      alert('Could not read saved deals.');
      return;
    }
    if (!list.length) { alert('No saved deals yet.'); return; }
    const cols = Object.keys(list[0]);
    const esc = (v: unknown) => {
      const s = String(v ?? '');
      return s.includes('"') || s.includes(',') || s.includes('\n')
        ? '"' + s.replaceAll('"', '""') + '"'
        : s;
    };
    const csv = [cols.join(','), ...list.map(o => cols.map(c => esc(o[c])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'rg_imports_saved_deals.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const breakdownRows: [string, number][] = [
    ['Declared (BDS)',                                          decl.declaredBds],
    ['Freight (BDS)',                                           decl.freightBds],
    ['Customs Value',                                           decl.customsValue],
    [`Import Duty (${(decl.idr * 100).toFixed(2)}%)`,          decl.importDuty],
    [`Excise (${(decl.excR * 100).toFixed(2)}%)`,              decl.excise],
    [`VAT (${(decl.vatPct * 100).toFixed(2)}%)`,               decl.vat],
    ['Processing Fee',                                          decl.proc],
    ['Total Duties & Fees',                                     decl.dutiesTotal],
    ['Total Declaration Cost',                                  decl.declTotal],
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Vehicle Cost Calculator</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Bank fees on purchase price · Customs / Excise / VAT on declared amount
        </p>
      </div>

      {/* ── Section 1: Bank Fees ─────────────────────────────────────────── */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          1 · Bank Fees
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Vendor Price (USD)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.vendorUsd} onChange={e => set('vendorUsd', e.target.value)} />
          </Field>
          <Field label="1st Payment (USD)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.pmt1Usd} onChange={e => set('pmt1Usd', e.target.value)} />
          </Field>
          <Field label="2nd Payment (USD) — auto">
            <input className="form-input bg-gray-50 text-gray-500" type="number" readOnly
              value={bank.pmt2.toFixed(2)} />
          </Field>
          <Field label="# of Payments">
            <select className="form-input" value={f.numPmts}
              onChange={e => set('numPmts', e.target.value)}>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </Field>
          <Field label="Wire Fee / Payment (USD)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.wireUsd} onChange={e => set('wireUsd', e.target.value)} />
          </Field>
          <Field label="USD → BDS Rate">
            <input className="form-input" type="number" min="0" step="0.00001"
              value={f.bankFxRate} onChange={e => set('bankFxRate', e.target.value)} />
          </Field>
          <Field label="Bank FX Fee (%)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.bankFxPct} onChange={e => set('bankFxPct', e.target.value)} />
          </Field>
          <Field label="Bank Fixed Fee / Payment (BDS)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.bankFixedBds} onChange={e => set('bankFixedBds', e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <KPI label="Total Paid (BDS)" value={bds(bank.totalBds)}
            sub="Incl. all bank fees" />
          <KPI label="Bank Fees (BDS)" value={bds(bank.feesBds)}
            sub="vs. straight conversion" />
        </div>
      </div>

      {/* ── Section 2: Declaration ───────────────────────────────────────── */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          2 · Declaration
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Declared Price (USD)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.declUsd} onChange={e => set('declUsd', e.target.value)} />
          </Field>
          <Field label="Freight (USD)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.freightUsd} onChange={e => set('freightUsd', e.target.value)} />
          </Field>
          <Field label="Decl. Exchange Rate">
            <input className="form-input" type="number" min="0" step="0.00001"
              value={f.declFxRate} onChange={e => set('declFxRate', e.target.value)} />
          </Field>
          <Field label="Decl. FX Fee (%)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.declFxPct} onChange={e => set('declFxPct', e.target.value)} />
          </Field>
          <Field label="Body Type">
            <select className="form-input" value={f.bodyType}
              onChange={e => set('bodyType', e.target.value)}>
              <option>Car</option>
              <option>Pickup</option>
            </select>
          </Field>
          <Field label="Engine Type">
            <select className="form-input" value={f.engineType}
              onChange={e => {
                const eng = e.target.value;
                const firstCC = Object.keys(EXCISE[eng] ?? {})[0] ?? '';
                setF(prev => ({ ...prev, engineType: eng, ccBracket: firstCC }));
              }}>
              {Object.keys(EXCISE).map(k => <option key={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="Engine CC Bracket">
            <select className="form-input" value={f.ccBracket}
              onChange={e => set('ccBracket', e.target.value)}>
              {ccOptions.map(k => <option key={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="VAT (%)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.vatPct} onChange={e => set('vatPct', e.target.value)} />
          </Field>
          <Field label="Car Import Duty (%)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.carDuty} onChange={e => set('carDuty', e.target.value)} />
          </Field>
          <Field label="Hybrid Discount (pts)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.hybDisc} onChange={e => set('hybDisc', e.target.value)} />
          </Field>
          <Field label="Pickup Import Duty (%)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.pickupDuty} onChange={e => set('pickupDuty', e.target.value)} />
          </Field>
          <Field label="Processing Fee (BDS)">
            <input className="form-input" type="number" min="0" step="0.01"
              value={f.procFee} onChange={e => set('procFee', e.target.value)} />
          </Field>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <KPI label="Total Duties & Fees" value={bds(decl.dutiesTotal)}
            sub={declWarn ? '⚠ Declared price is 0' : 'Duty + Excise + VAT + Processing'} />
          <KPI label="Total Declaration Cost" value={bds(decl.declTotal)}
            sub="Customs value + Duties" />
        </div>

        {/* Breakdown table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Line</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount (BDS)</th>
              </tr>
            </thead>
            <tbody>
              {breakdownRows.map(([name, amt]) => (
                <tr key={name} className="border-b border-gray-50 last:border-0">
                  <td className="py-1.5 text-gray-700">{name}</td>
                  <td className="py-1.5 text-right font-mono text-gray-900">{bds(amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Notes + Actions ──────────────────────────────────────────────── */}
      <div className="card space-y-3">
        <Field label="Notes (VIN / Stock # / anything)">
          <input className="form-input" type="text" placeholder="Optional"
            value={f.notes} onChange={e => set('notes', e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <button className="btn-primary" onClick={saveDeal}>
            {saved ? 'Saved!' : 'Save Deal'}
          </button>
          <button className="btn-secondary" onClick={() => { setF(INIT); setSaved(false); }}>
            Reset
          </button>
        </div>
        <button className="btn-secondary" onClick={exportDeals}>
          Export Saved Deals (CSV)
        </button>
        <p className="text-xs text-gray-400 text-center">
          Deals are saved in your browser on this device only.
        </p>
      </div>
    </div>
  );
}
