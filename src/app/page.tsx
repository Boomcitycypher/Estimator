'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Vehicle, Lead } from '@/lib/sheets';
import { formatBDS } from '@/lib/constants';

interface DashboardData {
  activeInventory: number;
  totalOutstandingBalance: number;
  grossProfitThisYear: number;
  activeLeads: number;
  vehicles: Vehicle[];
  leads: Lead[];
}

function StatusPill({ status }: { status: string }) {
  if (status === 'Inventory') return <span className="status-inventory">Inventory</span>;
  if (status === 'Sold') return <span className="status-sold">Sold</span>;
  if (status === 'Paid Off') return <span className="status-paidoff">Paid Off</span>;
  return <span className="status-inventory">{status}</span>;
}

function LeadStatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    New: 'status-lead-new',
    Quoted: 'status-lead-quoted',
    Interested: 'status-lead-interested',
    Converted: 'status-lead-converted',
    Dead: 'status-lead-dead',
  };
  return <span className={cls[status] || 'status-lead-new'}>{status}</span>;
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'inventory' | 'sold' | 'leads'>('inventory');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); } else { setData(d); }
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="card border-red-200 bg-red-50 text-red-700">
          <p className="font-semibold mb-1">Failed to load data</p>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-2">Check that your environment variables are set correctly.</p>
        </div>
      </div>
    );
  }

  const inventoryVehicles = data?.vehicles.filter(v => v.Status === 'Inventory') || [];
  const soldVehicles = data?.vehicles.filter(v => v.Status === 'Sold' || v.Status === 'Paid Off') || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="Active Inventory"
          value={data?.activeInventory ?? 0}
          sub="vehicles"
          color="#1d4ed8"
        />
        <SummaryCard
          label="Outstanding"
          value={formatBDS(data?.totalOutstandingBalance ?? 0)}
          sub="across sold vehicles"
          color="#d97706"
        />
        <SummaryCard
          label="Profit This Year"
          value={formatBDS(data?.grossProfitThisYear ?? 0)}
          sub="paid off vehicles"
          color="#198a4a"
        />
        <SummaryCard
          label="Active Leads"
          value={data?.activeLeads ?? 0}
          sub="new + interested"
          color="#7c3aed"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Link href="/add-vehicle" className="card text-center py-3 hover:bg-gray-50 active:bg-gray-100">
          <div className="text-2xl mb-1">🚗</div>
          <div className="text-xs font-medium text-gray-700">Add Vehicle</div>
        </Link>
        <Link href="/add-expense" className="card text-center py-3 hover:bg-gray-50 active:bg-gray-100">
          <div className="text-2xl mb-1">💸</div>
          <div className="text-xs font-medium text-gray-700">Add Expense</div>
        </Link>
        <Link href="/log-payment" className="card text-center py-3 hover:bg-gray-50 active:bg-gray-100">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xs font-medium text-gray-700">Log Payment</div>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(['inventory', 'sold', 'leads'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-sm font-medium capitalize transition-colors"
              style={{
                color: tab === t ? '#c8501a' : '#6b7280',
                borderBottom: tab === t ? '2px solid #c8501a' : '2px solid transparent',
              }}
            >
              {t === 'inventory' ? 'Inventory' : t === 'sold' ? 'Sold / Active' : 'Leads'}
            </button>
          ))}
        </div>

        <div className="p-2">
          {/* Inventory Tab */}
          {tab === 'inventory' && (
            <div>
              {inventoryVehicles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🚗</div>
                  <p className="text-sm">No vehicles in inventory</p>
                  <Link href="/add-vehicle" className="text-orange-600 text-sm font-medium mt-1 block">
                    Add your first vehicle →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {inventoryVehicles.map(v => (
                    <div key={v.VehicleID} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="font-semibold text-gray-900 text-sm">
                            {v.Year} {v.Make} {v.Model}
                          </span>
                          {v.Trim && <span className="text-gray-500 text-xs"> {v.Trim}</span>}
                        </div>
                        <StatusPill status={v.Status} />
                      </div>
                      <div className="text-xs text-gray-500 mb-2 font-mono">{v.ChassisNumber}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-400">Total Cost</div>
                          <div className="font-semibold text-gray-800">{formatBDS(v.TotalCost)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Target Price</div>
                          <div className="font-semibold text-gray-800">
                            {v.TargetSalePrice ? formatBDS(v.TargetSalePrice) : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Proj. Profit</div>
                          <div className="font-semibold" style={{ color: '#198a4a' }}>
                            {v.TargetSalePrice
                              ? formatBDS(v.TargetSalePrice - v.TotalCost)
                              : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Added {v.DateAdded}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sold Tab */}
          {tab === 'sold' && (
            <div>
              {soldVehicles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🏷️</div>
                  <p className="text-sm">No sold vehicles yet</p>
                  <Link href="/mark-sold" className="text-orange-600 text-sm font-medium mt-1 block">
                    Mark a vehicle as sold →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {soldVehicles.map(v => (
                    <div key={v.VehicleID} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="font-semibold text-gray-900 text-sm">
                            {v.Year} {v.Make} {v.Model}
                          </span>
                        </div>
                        <StatusPill status={v.Status} />
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        Buyer: <span className="font-medium">{v.BuyerName || '—'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-gray-400">Sale Price</div>
                          <div className="font-semibold text-gray-800">{formatBDS(v.FinalSalePrice)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Gross Profit</div>
                          <div className="font-semibold" style={{ color: '#198a4a' }}>
                            {formatBDS(v.GrossProfit)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Remaining Bal.</div>
                          <div
                            className="font-semibold"
                            style={{ color: v.RemainingBalance > 0 ? '#d97706' : '#198a4a' }}
                          >
                            {formatBDS(v.RemainingBalance)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Total Cost</div>
                          <div className="font-semibold text-gray-800">{formatBDS(v.TotalCost)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leads Tab */}
          {tab === 'leads' && (
            <div>
              {(data?.leads || []).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">👤</div>
                  <p className="text-sm">No leads yet</p>
                  <Link href="/add-lead" className="text-orange-600 text-sm font-medium mt-1 block">
                    Add your first lead →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {(data?.leads || []).map(l => (
                    <div key={l.LeadID} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="font-semibold text-gray-900 text-sm">{l.ProspectName}</span>
                          {l.Phone && <span className="text-gray-500 text-xs block">{l.Phone}</span>}
                        </div>
                        <LeadStatusPill status={l.Status} />
                      </div>
                      <div className="text-xs text-gray-600">
                        {[l.Year, l.Make, l.Model, l.Trim].filter(Boolean).join(' ') || 'No vehicle specified'}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div>
                          <div className="text-gray-400">Budget</div>
                          <div className="font-semibold text-gray-800">
                            {l.Budget ? formatBDS(l.Budget) : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Quoted</div>
                          <div className="font-semibold text-gray-800">
                            {l.QuotedPrice ? formatBDS(l.QuotedPrice) : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {l.Source} · {l.DateAdded}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
