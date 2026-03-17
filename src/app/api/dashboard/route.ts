import { NextResponse } from 'next/server';
import { getAllVehicles, readSheet, rowToLead } from '@/lib/sheets';

export async function GET() {
  try {
    const [vehicles, leadRows] = await Promise.all([
      getAllVehicles(),
      readSheet('Leads!A:M'),
    ]);

    const leads = leadRows.length > 1
      ? leadRows.slice(1).filter(r => r[0]).map(rowToLead)
      : [];

    const currentYear = new Date().getFullYear().toString();

    const activeInventory = vehicles.filter(v => v.Status === 'Inventory').length;
    const totalOutstandingBalance = vehicles
      .filter(v => v.Status === 'Sold')
      .reduce((sum, v) => sum + (v.RemainingBalance || 0), 0);
    const grossProfitThisYear = vehicles
      .filter(v => v.Status === 'Paid Off' && v.SaleDate?.startsWith(currentYear))
      .reduce((sum, v) => sum + (v.GrossProfit || 0), 0);
    const activeLeads = leads.filter(l => l.Status === 'New' || l.Status === 'Interested').length;

    return NextResponse.json({
      activeInventory,
      totalOutstandingBalance,
      grossProfitThisYear,
      activeLeads,
      vehicles,
      leads,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
