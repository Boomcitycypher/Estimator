import { NextRequest, NextResponse } from 'next/server';
import { readSheet, appendToSheet, recalcVehicle, rowToExpense } from '@/lib/sheets';

export async function GET() {
  try {
    const rows = await readSheet('Expenses!A:I');
    if (rows.length <= 1) return NextResponse.json([]);
    const expenses = rows.slice(1).filter(r => r[0]).map(rowToExpense);
    return NextResponse.json(expenses);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vehicleId, category, amount, date, paidBy, paymentMethod, referenceNumber, notes } = body;

    if (!vehicleId || !category || !amount || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expenseId = `EXP-${Date.now()}`;
    const row = [
      expenseId,
      vehicleId,
      date,
      category,
      parseFloat(amount),
      paidBy || '',
      paymentMethod || '',
      referenceNumber || '',
      notes || '',
    ];

    await appendToSheet('Expenses!A:I', [row]);
    await recalcVehicle(vehicleId);

    return NextResponse.json({ success: true, expenseId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
