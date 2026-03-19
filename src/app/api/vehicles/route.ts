import { NextRequest, NextResponse } from 'next/server';
import {
  getAllVehicles,
  appendToSheet,
  readSheet,
} from '@/lib/sheets';
import { today } from '@/lib/constants';

export async function GET() {
  try {
    const vehicles = await getAllVehicles();
    return NextResponse.json(vehicles);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      year, make, model, trim, colour, chassisNumber, vendor,
      consigneeName, purchaseCost, targetSalePrice, partners, notes,
    } = body;

    // Validate required
    if (!year || !make || !model || !chassisNumber || !vendor || !purchaseCost || !partners) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check duplicate chassis
    const rows = await readSheet('Vehicles!A:B');
    const duplicate = rows.slice(1).find(r => r[1]?.toLowerCase() === chassisNumber.toLowerCase());
    if (duplicate) {
      return NextResponse.json(
        { error: `Chassis number "${chassisNumber}" already exists (Vehicle: ${duplicate[0]})` },
        { status: 409 }
      );
    }

    const vehicleId = `${year}-${make.toUpperCase()}-${chassisNumber}`;
    const totalExpenses = 0;
    const totalCost = parseFloat(purchaseCost);
    const row = [
      vehicleId,
      chassisNumber,
      year,
      make,
      model,
      trim || '',
      colour || '',
      vendor,
      consigneeName || '',
      '', // BuyerName
      parseFloat(purchaseCost),
      totalExpenses,
      totalCost,
      targetSalePrice ? parseFloat(targetSalePrice) : '',
      '', // FinalSalePrice
      '', // GrossProfit
      '', // PartnerShare
      0,  // TotalPaymentsReceived
      '', // RemainingBalance
      '', // ProfitMargin
      'Inventory',
      partners,
      '', // SaleDate
      today(),
      notes || '',
    ];

    await appendToSheet('Vehicles!A:Y', [row]);
    return NextResponse.json({ success: true, vehicleId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
