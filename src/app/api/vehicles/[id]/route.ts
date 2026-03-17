import { NextRequest, NextResponse } from 'next/server';
import {
  readSheet,
  updateSheetRow,
  rowToVehicle,
  recalcVehicle,
} from '@/lib/sheets';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rows = await readSheet('Vehicles!A:Y');
    const row = rows.slice(1).find(r => r[0] === params.id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToVehicle(row));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const rows = await readSheet('Vehicles!A:Y');
    const idx = rows.findIndex((r, i) => i >= 1 && r[0] === params.id);
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sheetRow = idx + 1;

    // Apply patch fields
    const {
      buyerName, finalSalePrice, saleDate,
      targetSalePrice, notes, status,
    } = body;

    if (buyerName !== undefined) {
      await updateSheetRow(`Vehicles!J${sheetRow}`, [[buyerName]]);
    }
    if (finalSalePrice !== undefined) {
      await updateSheetRow(`Vehicles!O${sheetRow}`, [[parseFloat(finalSalePrice)]]);
    }
    if (targetSalePrice !== undefined) {
      await updateSheetRow(`Vehicles!N${sheetRow}`, [[parseFloat(targetSalePrice)]]);
    }
    if (saleDate !== undefined) {
      await updateSheetRow(`Vehicles!W${sheetRow}`, [[saleDate]]);
    }
    if (notes !== undefined) {
      await updateSheetRow(`Vehicles!Y${sheetRow}`, [[notes]]);
    }
    if (status !== undefined) {
      await updateSheetRow(`Vehicles!U${sheetRow}`, [[status]]);
    }

    // Recalculate derived columns
    await recalcVehicle(params.id);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
