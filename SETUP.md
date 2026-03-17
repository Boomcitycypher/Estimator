# R&G Imports — Setup Guide

## 1. Create the Google Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Rename the spreadsheet to **R&G Imports**
3. Create **5 tabs** (sheets) with these exact names and headers:

### Tab 1: `Vehicles`
```
VehicleID | ChassisNumber | Year | Make | Model | Trim | Colour | Vendor | ConsigneeName | BuyerName | PurchaseCost | TotalExpenses | TotalCost | TargetSalePrice | FinalSalePrice | GrossProfit | PartnerShare | TotalPaymentsReceived | RemainingBalance | ProfitMargin | Status | Partners | SaleDate | DateAdded | Notes
```

### Tab 2: `Expenses`
```
ExpenseID | VehicleID | Date | Category | Amount | PaidBy | PaymentMethod | ReferenceNumber | Notes
```

### Tab 3: `Payments`
```
PaymentID | VehicleID | CustomerName | PaymentType | AmountReceived | DateReceived | PaymentMethod | ReceivingAccount | Notes
```

### Tab 4: `Partners`
```
PartnerName | TotalCapitalExposed | TotalProfitEarned | ProfitPending | TotalDisbursed | BalanceDue | ActiveVehicleCount
```
Add these 4 static rows: `JJ`, `HDD`, `KNH`, `R&G`

### Tab 5: `Leads`
```
LeadID | DateAdded | ProspectName | Phone | Year | Make | Model | Trim | Budget | Source | Status | QuotedPrice | Notes
```

4. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`YOUR_SPREADSHEET_ID`**`/edit`

---

## 2. Create a Google Cloud Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable the **Google Sheets API**:
   - Navigate to **APIs & Services → Library**
   - Search for "Google Sheets API" and click **Enable**
4. Create a service account:
   - Navigate to **APIs & Services → Credentials**
   - Click **Create Credentials → Service Account**
   - Give it a name like `rg-imports-app`
   - Click **Create and Continue**, skip optional steps, click **Done**
5. Create a JSON key:
   - Click on the service account you just created
   - Go to the **Keys** tab
   - Click **Add Key → Create new key → JSON**
   - Download the JSON file — keep it safe!
6. Share your spreadsheet with the service account:
   - Open your Google Sheet
   - Click **Share**
   - Paste the service account email (e.g. `rg-imports-app@your-project.iam.gserviceaccount.com`)
   - Give it **Editor** access
   - Click **Send**

---

## 3. Set Environment Variables

Create a file called `.env.local` in the project root:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END RSA PRIVATE KEY-----"
```

Find these values in the downloaded JSON key file:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` → `client_email` field
- `GOOGLE_PRIVATE_KEY` → `private_key` field (copy the entire value including `-----BEGIN...-----END-----`)

**Important:** The private key should be wrapped in double quotes, and newlines should stay as `\n`.

---

## 4. Run Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy
vercel
```

Follow the prompts. When asked, add your environment variables:
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

**Or deploy via the Vercel dashboard:**
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Add the 3 environment variables under **Environment Variables**
5. Click **Deploy**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Failed to load data` on dashboard | Check your 3 env variables are set correctly |
| `Sheets API not enabled` error | Enable Google Sheets API in Google Cloud Console |
| `Permission denied` error | Make sure the spreadsheet is shared with the service account email |
| Private key errors | Ensure `\n` newlines are preserved in `GOOGLE_PRIVATE_KEY` |
| Tab name errors | Sheet tab names must match exactly: `Vehicles`, `Expenses`, `Payments`, `Partners`, `Leads` |
