import { NextRequest, NextResponse } from 'next/server';
import { readSheet, appendToSheet, rowToLead } from '@/lib/sheets';
import { today } from '@/lib/constants';

export async function GET() {
  try {
    const rows = await readSheet('Leads!A:M');
    if (rows.length <= 1) return NextResponse.json([]);
    const leads = rows.slice(1).filter(r => r[0]).map(rowToLead);
    return NextResponse.json(leads);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prospectName, phone, year, make, model, trim,
      budget, source, quotedPrice, notes,
    } = body;

    if (!prospectName) {
      return NextResponse.json({ error: 'Prospect name is required' }, { status: 400 });
    }

    const leadId = `LEAD-${Date.now()}`;
    const row = [
      leadId,
      today(),
      prospectName,
      phone || '',
      year || '',
      make || '',
      model || '',
      trim || '',
      budget ? parseFloat(budget) : '',
      source || '',
      'New',
      quotedPrice ? parseFloat(quotedPrice) : '',
      notes || '',
    ];

    await appendToSheet('Leads!A:M', [row]);
    return NextResponse.json({ success: true, leadId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
