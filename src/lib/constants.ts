export const MAKES = ['Honda', 'Nissan', 'Toyota', 'Suzuki', 'Mazda', 'Mitsubishi', 'Hyundai', 'Other'];
export const MODELS = ['Vezel', 'Kicks', 'Note', 'Yaris Cross', 'Yaris', 'CX-5', 'Aqua', 'Swift', 'Vitz', 'X-Trail', 'Aura', 'Other'];
export const VENDORS = ['Jimex', 'Captain Traders', 'AutoCraftJapan', 'ITC', 'Kono', 'Vigo Asia', 'Be Forward', 'Other'];
export const COLOURS = ['White', 'Black', 'Silver', 'Grey', 'Blue', 'Red', 'Other'];
export const EXPENSE_CATEGORIES = [
  'Customs Duty', 'Shipping Documents', 'Brokerage / Clearance', 'Courier / ZNH Services',
  'Vehicle Registration (BLA)', 'TAMIS Fee', 'Repairs / Bodywork', 'Parts Purchase',
  'Radio / Electronics', 'License Plates', 'Cleaning / Detailing', 'Valuation Fee',
  'Insurance', 'Marketing / Instagram', 'Storage', 'Other',
];
export const PAYMENT_METHODS = ['Bank Transfer', 'Cheque', 'Cash', 'Bank Draft', 'Credit Card'];
export const RECEIVING_ACCOUNTS = ['FCB R&G ***5072', 'CIBC R&G', 'Sagicor', 'Other'];
export const PARTNER_OPTIONS = [
  'All 3 (equal split)', 'JJ + R&G only', 'HDD + R&G only', 'KNH + R&G only', 'R&G only',
];
export const LEAD_SOURCES = ['Referral', 'Instagram', 'WhatsApp Inquiry', 'Walk-in', 'Other'];
export const LEAD_STATUSES = ['New', 'Quoted', 'Interested', 'Converted', 'Dead'];
export const PAYMENT_TYPES = ['Deposit', 'Partial Payment', 'Balance', 'Full Payment'];
export const YEARS = ['2024', '2023', '2022', '2021', '2020', '2019', '2018'];
export const PAID_BY_OPTIONS = ['R&G Account', 'JJ', 'HDD', 'KNH'];

export function formatBDS(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}
