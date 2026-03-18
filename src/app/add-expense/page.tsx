'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormWrapper from '@/components/FormWrapper';
import SuccessMessage from '@/components/SuccessMessage';
import Spinner from '@/components/Spinner';
import type { Vehicle } from '@/lib/sheets';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, PAID_BY_OPTIONS, formatBDS, today } from '@/lib/constants';

const schema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required').refine(v => parseFloat(v) > 0, 'Must be a positive number'),
  date: z.string().min(1, 'Date is required'),
  paidBy: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SuccessData { expenseId: string; category: string; amount: string; vehicleLabel: string }

export default function AddExpense() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today() },
  });

  useEffect(() => {
    fetch('/api/vehicles')
      .then(r => r.json())
      .then((v: Vehicle[]) => {
        setVehicles(v.filter(x => x.Status === 'Inventory' || x.Status === 'Sold'));
        setLoadingVehicles(false);
      })
      .catch(() => setLoadingVehicles(false));
  }, []);

  const selectedId = watch('vehicleId');
  const selectedVehicle = vehicles.find(v => v.VehicleID === selectedId);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError('');
    const vehicleLabel = selectedVehicle
      ? `${selectedVehicle.Year} ${selectedVehicle.Make} ${selectedVehicle.Model}`
      : data.vehicleId;
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save expense');
      setSuccess({ expenseId: json.expenseId, category: data.category, amount: data.amount, vehicleLabel });
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SuccessMessage
        title="Expense Logged!"
        items={[
          { label: 'Expense ID', value: success.expenseId },
          { label: 'Vehicle', value: success.vehicleLabel },
          { label: 'Category', value: success.category },
          { label: 'Amount', value: formatBDS(parseFloat(success.amount)) },
        ]}
        onReset={() => { setSuccess(null); reset({ date: today() }); }}
        resetLabel="Add Another Expense"
      />
    );
  }

  return (
    <FormWrapper title="Add Expense" subtitle="Log a cost against a vehicle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Vehicle */}
        <div>
          <label className="form-label">Vehicle *</label>
          {loadingVehicles ? (
            <div className="form-input flex items-center gap-2 text-gray-400">
              <Spinner size={4} /> Loading vehicles...
            </div>
          ) : (
            <select className="form-input" {...register('vehicleId')}>
              <option value="">Select vehicle</option>
              {vehicles.map(v => (
                <option key={v.VehicleID} value={v.VehicleID}>
                  {v.Year} {v.Make} {v.Model} — {v.ChassisNumber}
                </option>
              ))}
            </select>
          )}
          {errors.vehicleId && <p className="text-red-500 text-xs mt-1">{errors.vehicleId.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="form-label">Expense Category *</label>
          <select className="form-input" {...register('category')}>
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className="form-label">Amount (BDS$) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              className="form-input pl-8"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('amount')}
            />
          </div>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        {/* Date */}
        <div>
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" max={today()} {...register('date')} />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>

        {/* Paid By */}
        <div>
          <label className="form-label">Paid By</label>
          <select className="form-input" {...register('paidBy')}>
            <option value="">Select who paid</option>
            {PAID_BY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="form-label">Payment Method</label>
          <select className="form-input" {...register('paymentMethod')}>
            <option value="">Select method</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Reference Number */}
        <div>
          <label className="form-label">Reference / Invoice Number</label>
          <input className="form-input" type="text" placeholder="INV-0001" {...register('referenceNumber')} />
        </div>

        {/* Notes */}
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-input" rows={2} placeholder="Any details..." {...register('notes')} />
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{serverError}</p>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <><Spinner /> Saving...</> : 'Log Expense'}
        </button>
      </form>
    </FormWrapper>
  );
}
