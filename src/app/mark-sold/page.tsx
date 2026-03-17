'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormWrapper from '@/components/FormWrapper';
import SuccessMessage from '@/components/SuccessMessage';
import Spinner from '@/components/Spinner';
import { Vehicle } from '@/lib/sheets';
import { formatBDS, today } from '@/lib/constants';

const schema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  buyerName: z.string().min(1, 'Buyer name is required'),
  buyerPhone: z.string().optional(),
  finalSalePrice: z.string().min(1, 'Sale price is required').refine(v => parseFloat(v) > 0, 'Must be a positive number'),
  saleDate: z.string().min(1, 'Sale date is required'),
  initialDeposit: z.string().optional().refine(v => !v || parseFloat(v) >= 0, 'Must be a positive number'),
});

type FormData = z.infer<typeof schema>;

interface SuccessData {
  vehicleLabel: string;
  buyerName: string;
  finalSalePrice: string;
  saleDate: string;
  deposit?: string;
}

export default function MarkSold() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { saleDate: today() },
  });

  useEffect(() => {
    fetch('/api/vehicles')
      .then(r => r.json())
      .then((v: Vehicle[]) => {
        setVehicles(v.filter(x => x.Status === 'Inventory'));
        setLoadingVehicles(false);
      })
      .catch(() => setLoadingVehicles(false));
  }, []);

  const selectedId = watch('vehicleId');
  const finalSalePrice = watch('finalSalePrice');
  const selectedVehicle = vehicles.find(v => v.VehicleID === selectedId);

  const projectedProfit = selectedVehicle && finalSalePrice
    ? parseFloat(finalSalePrice) - selectedVehicle.TotalCost
    : null;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError('');
    const vehicleLabel = selectedVehicle
      ? `${selectedVehicle.Year} ${selectedVehicle.Make} ${selectedVehicle.Model}`
      : data.vehicleId;
    try {
      // Update vehicle
      const patchRes = await fetch(`/api/vehicles/${encodeURIComponent(data.vehicleId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: data.buyerName,
          finalSalePrice: data.finalSalePrice,
          saleDate: data.saleDate,
        }),
      });
      const patchJson = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchJson.error || 'Failed to update vehicle');

      // Log deposit if provided
      if (data.initialDeposit && parseFloat(data.initialDeposit) > 0) {
        const payRes = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: data.vehicleId,
            customerName: data.buyerName,
            paymentType: 'Deposit',
            amountReceived: data.initialDeposit,
            dateReceived: data.saleDate,
            paymentMethod: 'Cash',
          }),
        });
        if (!payRes.ok) {
          const payJson = await payRes.json();
          throw new Error(payJson.error || 'Failed to log deposit');
        }
      }

      setSuccess({
        vehicleLabel,
        buyerName: data.buyerName,
        finalSalePrice: data.finalSalePrice,
        saleDate: data.saleDate,
        deposit: data.initialDeposit && parseFloat(data.initialDeposit) > 0 ? data.initialDeposit : undefined,
      });
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const items = [
      { label: 'Vehicle', value: success.vehicleLabel },
      { label: 'Buyer', value: success.buyerName },
      { label: 'Sale Price', value: formatBDS(parseFloat(success.finalSalePrice)) },
      { label: 'Sale Date', value: success.saleDate },
    ];
    if (success.deposit) {
      items.push({ label: 'Deposit Logged', value: formatBDS(parseFloat(success.deposit)) });
    }
    return (
      <SuccessMessage
        title="Vehicle Marked as Sold!"
        items={items}
        onReset={() => { setSuccess(null); reset({ saleDate: today() }); }}
        resetLabel="Mark Another Vehicle Sold"
      />
    );
  }

  return (
    <FormWrapper title="Mark Vehicle as Sold" subtitle="Record a vehicle sale">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Vehicle */}
        <div>
          <label className="form-label">Vehicle *</label>
          {loadingVehicles ? (
            <div className="form-input flex items-center gap-2 text-gray-400">
              <Spinner size={4} /> Loading vehicles...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="form-input text-gray-400 text-sm">No inventory vehicles available</div>
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

          {selectedVehicle && (
            <div className="mt-1 text-xs text-gray-500 bg-gray-50 rounded p-2 space-y-0.5">
              <div>Total Cost: <span className="font-semibold">{formatBDS(selectedVehicle.TotalCost)}</span></div>
              {selectedVehicle.TargetSalePrice > 0 && (
                <div>Target Price: <span className="font-semibold">{formatBDS(selectedVehicle.TargetSalePrice)}</span></div>
              )}
            </div>
          )}
        </div>

        {/* Buyer Name */}
        <div>
          <label className="form-label">Buyer Name *</label>
          <input className="form-input" type="text" placeholder="Full name" {...register('buyerName')} />
          {errors.buyerName && <p className="text-red-500 text-xs mt-1">{errors.buyerName.message}</p>}
        </div>

        {/* Buyer Phone */}
        <div>
          <label className="form-label">Buyer Phone</label>
          <input className="form-input" type="tel" placeholder="+1 246 XXX XXXX" {...register('buyerPhone')} />
        </div>

        {/* Final Sale Price */}
        <div>
          <label className="form-label">Final Sale Price (BDS$) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              className="form-input pl-8"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('finalSalePrice')}
            />
          </div>
          {errors.finalSalePrice && <p className="text-red-500 text-xs mt-1">{errors.finalSalePrice.message}</p>}

          {projectedProfit !== null && (
            <div className="mt-1 text-xs rounded p-2" style={{ backgroundColor: projectedProfit >= 0 ? '#f0fdf4' : '#fef2f2' }}>
              Gross Profit: <span className="font-semibold" style={{ color: projectedProfit >= 0 ? '#198a4a' : '#dc2626' }}>
                {formatBDS(projectedProfit)}
              </span>
              {projectedProfit > 0 && (
                <span className="text-gray-500"> · Each partner: {formatBDS(projectedProfit / 3)}</span>
              )}
            </div>
          )}
        </div>

        {/* Sale Date */}
        <div>
          <label className="form-label">Sale Date *</label>
          <input className="form-input" type="date" max={today()} {...register('saleDate')} />
          {errors.saleDate && <p className="text-red-500 text-xs mt-1">{errors.saleDate.message}</p>}
        </div>

        {/* Initial Deposit */}
        <div>
          <label className="form-label">Initial Deposit Received (BDS$)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              className="form-input pl-8"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00 (optional)"
              {...register('initialDeposit')}
            />
          </div>
          {errors.initialDeposit && <p className="text-red-500 text-xs mt-1">{errors.initialDeposit.message}</p>}
          <p className="text-xs text-gray-400 mt-1">Will be logged as a Deposit payment automatically</p>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{serverError}</p>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <><Spinner /> Saving...</> : 'Mark as Sold'}
        </button>
      </form>
    </FormWrapper>
  );
}
