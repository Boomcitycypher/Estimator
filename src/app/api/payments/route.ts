import { NextRequest, NextResponse } from 'next/server';
import { readSheet, appendToSheet, recalcVehicle, rowToPayment } from '@/lib/sheets';

export async function GET() {
  try {
    const rows = await readSheet('Payments!A:I');
    if (rows.length <= 1) return NextResponse.json([]);
    const payments = rows.slice(1).filter(r => r[0]).map(rowToPayment);
    return NextResponse.json(payments);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vehicleId, customerName, paymentType, amountReceived,
      dateReceived, paymentMethod, receivingAccount, notes,
    } = body;

    if (!vehicleId || !customerName || !paymentType || !amountReceived || !dateReceived || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const paymentId = `PAY-${Date.now()}`;
    const row = [
      paymentId,
      vehicleId,
      customerName,
      paymentType,
      parseFloat(amountReceived),
      dateReceived,
      paymentMethod,
      receivingAccount || '',
      notes || '',
    ];

    await appendToSheet('Payments!A:I', [row]);
    await recalcVehicle(vehicleId);

    return NextResponse.json({ success: true, paymentId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
