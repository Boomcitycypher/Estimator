'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormWrapper from '@/components/FormWrapper';
import SuccessMessage from '@/components/SuccessMessage';
import Spinner from '@/components/Spinner';
import { Vehicle } from '@/lib/sheets';
import { PAYMENT_METHODS, RECEIVING_ACCOUNTS, PAYMENT_TYPES, formatBDS, today } from '@/lib/constants';

const schema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  paymentType: z.string().min(1, 'Payment type is required'),
  amountReceived: z.string().min(1, 'Amount is required').refine(v => parseFloat(v) > 0, 'Must be a positive number'),
  dateReceived: z.string().min(1, 'Date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  receivingAccount: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SuccessData {
  paymentId: string;
  vehicleLabel: string;
  customerName: string;
  amountReceived: string;
  paymentType: string;
}

export default function LogPayment() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { dateReceived: today() },
  });

  useEffect(() => {
    fetch('/api/vehicles')
      .then(r => r.json())
      .then((v: Vehicle[]) => {
        setVehicles(v.filter(x => x.Status === 'Sold' || x.Status === 'Inventory'));
        setLoadingVehicles(false);
      })
      .catch(() => setLoadingVehicles(false));
  }, []);

  const selectedId = watch('vehicleId');
  const selectedVehicle = vehicles.find(v => v.VehicleID === selectedId);

  // Auto-fill customer name when vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      const name = selectedVehicle.BuyerName || selectedVehicle.ConsigneeName || '';
      setValue('customerName', name);
    }
  }, [selectedId, selectedVehicle, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError('');
    const vehicleLabel = selectedVehicle
      ? `${selectedVehicle.Year} ${selectedVehicle.Make} ${selectedVehicle.Model}`
      : data.vehicleId;
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save payment');
      setSuccess({
        paymentId: json.paymentId,
        vehicleLabel,
        customerName: data.customerName,
        amountReceived: data.amountReceived,
        paymentType: data.paymentType,
      });
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SuccessMessage
        title="Payment Logged!"
        items={[
          { label: 'Payment ID', value: success.paymentId },
          { label: 'Vehicle', value: success.vehicleLabel },
          { label: 'Customer', value: success.customerName },
          { label: 'Type', value: success.paymentType },
          { label: 'Amount', value: formatBDS(parseFloat(success.amountReceived)) },
        ]}
        onReset={() => { setSuccess(null); reset({ dateReceived: today() }); }}
        resetLabel="Log Another Payment"
      />
    );
  }

  return (
    <FormWrapper title="Log Customer Payment" subtitle="Record a payment received from a customer">
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
                  {v.Make} {v.Model} {v.Year} — {v.ChassisNumber}
                  {v.RemainingBalance > 0 ? ` | Bal: ${formatBDS(v.RemainingBalance)}` : ''}
                </option>
              ))}
            </select>
          )}
          {errors.vehicleId && <p className="text-red-500 text-xs mt-1">{errors.vehicleId.message}</p>}
          {selectedVehicle && (
            <div className="mt-1 text-xs text-gray-500 bg-gray-50 rounded p-2">
              Remaining balance: <span className="font-semibold text-amber-700">{formatBDS(selectedVehicle.RemainingBalance)}</span>
            </div>
          )}
        </div>

        {/* Customer Name */}
        <div>
          <label className="form-label">Customer Name *</label>
          <input className="form-input" type="text" placeholder="Customer full name" {...register('customerName')} />
          {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
        </div>

        {/* Payment Type */}
        <div>
          <label className="form-label">Payment Type *</label>
          <select className="form-input" {...register('paymentType')}>
            <option value="">Select type</option>
            {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.paymentType && <p className="text-red-500 text-xs mt-1">{errors.paymentType.message}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className="form-label">Amount Received (BDS$) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              className="form-input pl-8"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('amountReceived')}
            />
          </div>
          {errors.amountReceived && <p className="text-red-500 text-xs mt-1">{errors.amountReceived.message}</p>}
        </div>

        {/* Date */}
        <div>
          <label className="form-label">Date Received *</label>
          <input className="form-input" type="date" max={today()} {...register('dateReceived')} />
          {errors.dateReceived && <p className="text-red-500 text-xs mt-1">{errors.dateReceived.message}</p>}
        </div>

        {/* Payment Method */}
        <div>
          <label className="form-label">Payment Method *</label>
          <select className="form-input" {...register('paymentMethod')}>
            <option value="">Select method</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>}
        </div>

        {/* Receiving Account */}
        <div>
          <label className="form-label">Receiving Account</label>
          <select className="form-input" {...register('receivingAccount')}>
            <option value="">Select account</option>
            {RECEIVING_ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
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
          {loading ? <><Spinner /> Saving...</> : 'Log Payment'}
        </button>
      </form>
    </FormWrapper>
  );
}
