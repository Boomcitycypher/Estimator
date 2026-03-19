import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

export async function readSheet(range: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return (response.data.values as string[][]) || [];
}

export async function appendToSheet(range: string, values: (string | number | null)[][]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

export async function updateSheetRow(range: string, values: (string | number | null)[][]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

export async function findRowByValue(
  sheetName: string,
  columnIndex: number,
  value: string
): Promise<{ rowIndex: number; rowData: string[] } | null> {
  const rows = await readSheet(`${sheetName}!A:Z`);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][columnIndex] === value) {
      return { rowIndex: i + 1, rowData: rows[i] };
    }
  }
  return null;
}

// ─── Vehicles ───────────────────────────────────────────────────────────────

export const VEHICLE_COLS = [
  'VehicleID', 'ChassisNumber', 'Year', 'Make', 'Model', 'Trim', 'Colour',
  'Vendor', 'ConsigneeName', 'BuyerName', 'PurchaseCost', 'TotalExpenses',
  'TotalCost', 'TargetSalePrice', 'FinalSalePrice', 'GrossProfit',
  'PartnerShare', 'TotalPaymentsReceived', 'RemainingBalance', 'ProfitMargin',
  'Status', 'Partners', 'SaleDate', 'DateAdded', 'Notes',
];

export interface Vehicle {
  VehicleID: string;
  ChassisNumber: string;
  Year: string;
  Make: string;
  Model: string;
  Trim: string;
  Colour: string;
  Vendor: string;
  ConsigneeName: string;
  BuyerName: string;
  PurchaseCost: number;
  TotalExpenses: number;
  TotalCost: number;
  TargetSalePrice: number;
  FinalSalePrice: number;
  GrossProfit: number;
  PartnerShare: number;
  TotalPaymentsReceived: number;
  RemainingBalance: number;
  ProfitMargin: number;
  Status: string;
  Partners: string;
  SaleDate: string;
  DateAdded: string;
  Notes: string;
}

export function rowToVehicle(row: string[]): Vehicle {
  return {
    VehicleID: row[0] || '',
    ChassisNumber: row[1] || '',
    Year: row[2] || '',
    Make: row[3] || '',
    Model: row[4] || '',
    Trim: row[5] || '',
    Colour: row[6] || '',
    Vendor: row[7] || '',
    ConsigneeName: row[8] || '',
    BuyerName: row[9] || '',
    PurchaseCost: parseFloat(row[10]) || 0,
    TotalExpenses: parseFloat(row[11]) || 0,
    TotalCost: parseFloat(row[12]) || 0,
    TargetSalePrice: parseFloat(row[13]) || 0,
    FinalSalePrice: parseFloat(row[14]) || 0,
    GrossProfit: parseFloat(row[15]) || 0,
    PartnerShare: parseFloat(row[16]) || 0,
    TotalPaymentsReceived: parseFloat(row[17]) || 0,
    RemainingBalance: parseFloat(row[18]) || 0,
    ProfitMargin: parseFloat(row[19]) || 0,
    Status: row[20] || 'Inventory',
    Partners: row[21] || '',
    SaleDate: row[22] || '',
    DateAdded: row[23] || '',
    Notes: row[24] || '',
  };
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  const rows = await readSheet('Vehicles!A:Y');
  if (rows.length <= 1) return [];
  return rows.slice(1).filter(r => r[0]).map(rowToVehicle);
}

export async function recalcVehicle(vehicleId: string): Promise<void> {
  const rows = await readSheet('Vehicles!A:Y');
  const headerOffset = 1;
  const idx = rows.findIndex((r, i) => i >= headerOffset && r[0] === vehicleId);
  if (idx < 0) return;

  const row = rows[idx];
  const purchaseCost = parseFloat(row[10]) || 0;

  // Sum expenses for this vehicle
  const expRows = await readSheet('Expenses!A:I');
  let totalExpenses = 0;
  for (let i = 1; i < expRows.length; i++) {
    if (expRows[i][1] === vehicleId) {
      totalExpenses += parseFloat(expRows[i][4]) || 0;
    }
  }

  // Sum payments for this vehicle
  const payRows = await readSheet('Payments!A:I');
  let totalPayments = 0;
  for (let i = 1; i < payRows.length; i++) {
    if (payRows[i][1] === vehicleId) {
      totalPayments += parseFloat(payRows[i][4]) || 0;
    }
  }

  const totalCost = purchaseCost + totalExpenses;
  const finalSalePrice = parseFloat(row[14]) || 0;
  const grossProfit = finalSalePrice > 0 ? finalSalePrice - totalCost : 0;
  const partners = row[21] || '';
  const splitCount = getPartnerSplitCount(partners);
  const partnerShare = grossProfit > 0 ? grossProfit / splitCount : 0;
  const remainingBalance = finalSalePrice > 0 ? finalSalePrice - totalPayments : 0;
  const profitMargin = finalSalePrice > 0 && grossProfit > 0 ? grossProfit / finalSalePrice : 0;

  let status = 'Inventory';
  if (finalSalePrice > 0) {
    status = remainingBalance <= 0 ? 'Paid Off' : 'Sold';
  }

  // Update columns: TotalExpenses(11), TotalCost(12), GrossProfit(15), PartnerShare(16),
  // TotalPaymentsReceived(17), RemainingBalance(18), ProfitMargin(19), Status(20)
  const sheetRow = idx + 1;
  await updateSheetRow(`Vehicles!L${sheetRow}`, [[totalExpenses]]);
  await updateSheetRow(`Vehicles!M${sheetRow}`, [[totalCost]]);
  await updateSheetRow(`Vehicles!P${sheetRow}`, [[grossProfit]]);
  await updateSheetRow(`Vehicles!Q${sheetRow}`, [[partnerShare]]);
  await updateSheetRow(`Vehicles!R${sheetRow}`, [[totalPayments]]);
  await updateSheetRow(`Vehicles!S${sheetRow}`, [[remainingBalance]]);
  await updateSheetRow(`Vehicles!T${sheetRow}`, [[profitMargin]]);
  await updateSheetRow(`Vehicles!U${sheetRow}`, [[status]]);
}

function getPartnerSplitCount(partners: string): number {
  if (partners === 'R&G only') return 1;
  if (
    partners === 'JJ + R&G only' ||
    partners === 'HDD + R&G only' ||
    partners === 'KNH + R&G only'
  ) return 2;
  return 3; // All 3
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export const EXPENSE_COLS = [
  'ExpenseID', 'VehicleID', 'Date', 'Category', 'Amount',
  'PaidBy', 'PaymentMethod', 'ReferenceNumber', 'Notes',
];

export interface Expense {
  ExpenseID: string;
  VehicleID: string;
  Date: string;
  Category: string;
  Amount: number;
  PaidBy: string;
  PaymentMethod: string;
  ReferenceNumber: string;
  Notes: string;
}

export function rowToExpense(row: string[]): Expense {
  return {
    ExpenseID: row[0] || '',
    VehicleID: row[1] || '',
    Date: row[2] || '',
    Category: row[3] || '',
    Amount: parseFloat(row[4]) || 0,
    PaidBy: row[5] || '',
    PaymentMethod: row[6] || '',
    ReferenceNumber: row[7] || '',
    Notes: row[8] || '',
  };
}

// ─── Payments ────────────────────────────────────────────────────────────────

export const PAYMENT_COLS = [
  'PaymentID', 'VehicleID', 'CustomerName', 'PaymentType', 'AmountReceived',
  'DateReceived', 'PaymentMethod', 'ReceivingAccount', 'Notes',
];

export interface Payment {
  PaymentID: string;
  VehicleID: string;
  CustomerName: string;
  PaymentType: string;
  AmountReceived: number;
  DateReceived: string;
  PaymentMethod: string;
  ReceivingAccount: string;
  Notes: string;
}

export function rowToPayment(row: string[]): Payment {
  return {
    PaymentID: row[0] || '',
    VehicleID: row[1] || '',
    CustomerName: row[2] || '',
    PaymentType: row[3] || '',
    AmountReceived: parseFloat(row[4]) || 0,
    DateReceived: row[5] || '',
    PaymentMethod: row[6] || '',
    ReceivingAccount: row[7] || '',
    Notes: row[8] || '',
  };
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export const LEAD_COLS = [
  'LeadID', 'DateAdded', 'ProspectName', 'Phone', 'Year', 'Make', 'Model',
  'Trim', 'Budget', 'Source', 'Status', 'QuotedPrice', 'Notes',
];

export interface Lead {
  LeadID: string;
  DateAdded: string;
  ProspectName: string;
  Phone: string;
  Year: string;
  Make: string;
  Model: string;
  Trim: string;
  Budget: number;
  Source: string;
  Status: string;
  QuotedPrice: number;
  Notes: string;
}

export function rowToLead(row: string[]): Lead {
  return {
    LeadID: row[0] || '',
    DateAdded: row[1] || '',
    ProspectName: row[2] || '',
    Phone: row[3] || '',
    Year: row[4] || '',
    Make: row[5] || '',
    Model: row[6] || '',
    Trim: row[7] || '',
    Budget: parseFloat(row[8]) || 0,
    Source: row[9] || '',
    Status: row[10] || 'New',
    QuotedPrice: parseFloat(row[11]) || 0,
    Notes: row[12] || '',
  };
}
