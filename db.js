/**
 * Motor Bros – Shared Data Layer (localStorage)
 * All modules read/write through these helpers.
 */

const DB = (() => {
  const KEYS = {
    vehicles: 'mb_vehicles',
    payments: 'mb_payments',
    leads:    'mb_leads',
    expenses: 'mb_expenses',
    partners: 'mb_partners',
  };

  /* ── seed demo data on first load ── */
  function seed() {
    if (get('vehicles').length) return;

    const partners = ['Alex', 'Jordan', 'Casey', 'Morgan'];
    save('partners', partners);

    const vehicles = [
      { id: 'V001', vin: '1HGBH41JXMN109186', year: 2021, make: 'Toyota', model: 'Camry',
        color: 'White', mileage: 34000, purchasePrice: 18500, importFees: 1200,
        salePrice: 24500, status: 'sold', ownerPartner: 'Alex', buyerName: 'Maria Santos',
        buyerPhone: '555-0101', saleDate: '2025-11-10', notes: '' },
      { id: 'V002', vin: '2T1BURHE0JC051482', year: 2020, make: 'Honda', model: 'Civic',
        color: 'Black', mileage: 52000, purchasePrice: 14200, importFees: 950,
        salePrice: 19800, status: 'sold', ownerPartner: 'Jordan', buyerName: 'David Kim',
        buyerPhone: '555-0202', saleDate: '2025-12-03', notes: 'Installment plan' },
      { id: 'V003', vin: '3VWF17AT5FM052403', year: 2022, make: 'Volkswagen', model: 'Jetta',
        color: 'Silver', mileage: 18000, purchasePrice: 21000, importFees: 1400,
        salePrice: 0, status: 'available', ownerPartner: 'Casey', buyerName: '',
        buyerPhone: '', saleDate: '', notes: 'Needs detail' },
      { id: 'V004', vin: '5NPE34AF8FH054352', year: 2023, make: 'Hyundai', model: 'Elantra',
        color: 'Blue', mileage: 9000, purchasePrice: 17800, importFees: 1100,
        salePrice: 0, status: 'available', ownerPartner: 'Morgan', buyerName: '',
        buyerPhone: '', saleDate: '', notes: '' },
      { id: 'V005', vin: '1N4AL3AP5JC219788', year: 2019, make: 'Nissan', model: 'Altima',
        color: 'Red', mileage: 67000, purchasePrice: 11500, importFees: 800,
        salePrice: 0, status: 'pending', ownerPartner: 'Alex', buyerName: 'Lisa Park',
        buyerPhone: '555-0303', saleDate: '', notes: 'Paperwork in progress' },
    ];
    save('vehicles', vehicles);

    const payments = [
      { id: 'P001', vehicleId: 'V002', buyerName: 'David Kim', amount: 5000,
        date: '2025-12-03', method: 'cash', note: 'Down payment' },
      { id: 'P002', vehicleId: 'V002', buyerName: 'David Kim', amount: 3000,
        date: '2026-01-05', method: 'transfer', note: 'Month 1' },
      { id: 'P003', vehicleId: 'V002', buyerName: 'David Kim', amount: 3000,
        date: '2026-02-07', method: 'transfer', note: 'Month 2' },
      { id: 'P004', vehicleId: 'V001', buyerName: 'Maria Santos', amount: 24500,
        date: '2025-11-10', method: 'bank', note: 'Full payment' },
    ];
    save('payments', payments);

    const leads = [
      { id: 'L001', name: 'Tom Rivera', phone: '555-0401', email: 'tom@email.com',
        interest: 'SUV under $25k', source: 'Instagram', status: 'hot',
        lastContact: '2026-03-10', assignedTo: 'Jordan', notes: 'Ready to buy this week' },
      { id: 'L002', name: 'Sarah Chen', phone: '555-0402', email: 'sarah@email.com',
        interest: '2022+ Sedan', source: 'Referral', status: 'warm',
        lastContact: '2026-03-05', assignedTo: 'Casey', notes: 'Financing pre-approval pending' },
      { id: 'L003', name: 'Mike Johnson', phone: '555-0403', email: '',
        interest: 'Any good deal', source: 'Walk-in', status: 'cold',
        lastContact: '2026-02-20', assignedTo: 'Morgan', notes: '' },
    ];
    save('leads', leads);

    const expenses = [
      { id: 'E001', vehicleId: 'V001', partner: 'Alex', category: 'Repair',
        amount: 650, date: '2025-10-15', description: 'Brake pads & rotors', receipt: '' },
      { id: 'E002', vehicleId: 'V003', partner: 'Casey', category: 'Import Fee',
        amount: 1400, date: '2025-11-20', description: 'Port customs clearance', receipt: '' },
      { id: 'E003', vehicleId: 'V004', partner: 'Morgan', category: 'Detailing',
        amount: 250, date: '2025-12-01', description: 'Full detail & polish', receipt: '' },
      { id: 'E004', vehicleId: 'V002', partner: 'Jordan', category: 'Repair',
        amount: 420, date: '2025-11-28', description: 'AC recharge & service', receipt: '' },
    ];
    save('expenses', expenses);
  }

  function get(key) {
    try { return JSON.parse(localStorage.getItem(KEYS[key])) || []; }
    catch { return []; }
  }

  function save(key, data) {
    localStorage.setItem(KEYS[key], JSON.stringify(data));
  }

  function getPartners() {
    const p = localStorage.getItem(KEYS.partners);
    return p ? JSON.parse(p) : ['Alex', 'Jordan', 'Casey', 'Morgan'];
  }

  function nextId(prefix, list) {
    const nums = list.map(x => parseInt((x.id || '').replace(prefix, '')) || 0);
    const next = (Math.max(0, ...nums) + 1).toString().padStart(3, '0');
    return `${prefix}${next}`;
  }

  /* ── vehicle helpers ── */
  function vehicleCost(v) {
    const exps = get('expenses').filter(e => e.vehicleId === v.id)
      .reduce((s, e) => s + Number(e.amount), 0);
    return Number(v.purchasePrice) + Number(v.importFees) + exps;
  }

  function vehicleRevenue(v) {
    return get('payments').filter(p => p.vehicleId === v.id)
      .reduce((s, p) => s + Number(p.amount), 0);
  }

  function vehicleProfit(v) {
    if (v.status === 'available') return null;
    return vehicleRevenue(v) - vehicleCost(v);
  }

  function customerBalance(v) {
    if (!v.salePrice) return 0;
    return Number(v.salePrice) - vehicleRevenue(v);
  }

  /* ── partner summary ── */
  function partnerSummary() {
    const vehicles = get('vehicles');
    const partners = getPartners();
    return partners.map(name => {
      const myVehicles = vehicles.filter(v => v.ownerPartner === name);
      const invested = myVehicles.reduce((s, v) => s + vehicleCost(v), 0);
      const revenue  = myVehicles.reduce((s, v) => s + vehicleRevenue(v), 0);
      const profit   = myVehicles.filter(v => v.status === 'sold')
                         .reduce((s, v) => s + (vehicleProfit(v) || 0), 0);
      return { name, vehicles: myVehicles.length, invested, revenue, profit };
    });
  }

  /* ── stats for dashboard ── */
  function stats() {
    const vehicles = get('vehicles');
    const leads    = get('leads');
    const available = vehicles.filter(v => v.status === 'available').length;
    const sold      = vehicles.filter(v => v.status === 'sold').length;
    const pending   = vehicles.filter(v => v.status === 'pending').length;
    const totalProfit = vehicles.filter(v => v.status === 'sold')
      .reduce((s, v) => s + (vehicleProfit(v) || 0), 0);
    const outstanding = vehicles.filter(v => v.status === 'sold')
      .reduce((s, v) => s + customerBalance(v), 0);
    const hotLeads = leads.filter(l => l.status === 'hot').length;
    return { available, sold, pending, totalProfit, outstanding, hotLeads, total: vehicles.length };
  }

  seed();

  return { get, save, getPartners, nextId, vehicleCost, vehicleRevenue, vehicleProfit, customerBalance, partnerSummary, stats };
})();
