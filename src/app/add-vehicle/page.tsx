'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormWrapper from '@/components/FormWrapper';
import SuccessMessage from '@/components/SuccessMessage';
import Spinner from '@/components/Spinner';
import {
  MAKES, MODELS, VENDORS, COLOURS, PARTNER_OPTIONS, YEARS, formatBDS,
} from '@/lib/constants';

const schema = z.object({
  year: z.string().min(1, 'Year is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  trim: z.string().optional(),
  colour: z.string().optional(),
  chassisNumber: z.string().min(1, 'Chassis number is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  consigneeName: z.string().optional(),
  purchaseCost: z.string().min(1, 'Purchase cost is required').refine(v => parseFloat(v) > 0, 'Must be a positive number'),
  targetSalePrice: z.string().optional().refine(v => !v || parseFloat(v) > 0, 'Must be a positive number'),
  partners: z.string().min(1, 'Partners is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SuccessData {
  vehicleId: string;
  year: string;
  make: string;
  model: string;
  purchaseCost: string;
}

export default function AddVehicle() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save vehicle');
      setSuccess({ vehicleId: json.vehicleId, year: data.year, make: data.make, model: data.model, purchaseCost: data.purchaseCost });
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SuccessMessage
        title="Vehicle Added!"
        items={[
          { label: 'Vehicle ID', value: success.vehicleId },
          { label: 'Vehicle', value: `${success.year} ${success.make} ${success.model}` },
          { label: 'Purchase Cost', value: formatBDS(parseFloat(success.purchaseCost)) },
          { label: 'Status', value: 'Inventory' },
        ]}
        onReset={() => { setSuccess(null); reset(); }}
        resetLabel="Add Another Vehicle"
      />
    );
  }

  return (
    <FormWrapper title="Add Vehicle" subtitle="Register a new vehicle in inventory">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Year + Make */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Year *</label>
            <select className="form-input" {...register('year')}>
              <option value="">Select year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
          </div>
          <div>
            <label className="form-label">Make *</label>
            <select className="form-input" {...register('make')}>
              <option value="">Select make</option>
              {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make.message}</p>}
          </div>
        </div>

        {/* Model + Trim */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Model *</label>
            <select className="form-input" {...register('model')}>
              <option value="">Select model</option>
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
          </div>
          <div>
            <label className="form-label">Trim</label>
            <input className="form-input" type="text" placeholder="e.g. RS, G" {...register('trim')} />
          </div>
        </div>

        {/* Colour */}
        <div>
          <label className="form-label">Colour</label>
          <select className="form-input" {...register('colour')}>
            <option value="">Select colour</option>
            {COLOURS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Chassis Number */}
        <div>
          <label className="form-label">Chassis Number *</label>
          <input
            className="form-input font-mono uppercase"
            type="text"
            placeholder="e.g. P15-012872"
            {...register('chassisNumber')}
          />
          {errors.chassisNumber && <p className="text-red-500 text-xs mt-1">{errors.chassisNumber.message}</p>}
        </div>

        {/* Vendor */}
        <div>
          <label className="form-label">Vendor *</label>
          <select className="form-input" {...register('vendor')}>
            <option value="">Select vendor</option>
            {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor.message}</p>}
        </div>

        {/* Consignee Name */}
        <div>
          <label className="form-label">Consignee Name</label>
          <input className="form-input" type="text" placeholder="Name on shipping documents" {...register('consigneeName')} />
        </div>

        {/* Purchase Cost */}
        <div>
          <label className="form-label">Purchase Cost (BDS$) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              className="form-input pl-8"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('purchaseCost')}
            />
          </div>
          {errors.purchaseCost && <p className="text-red-500 text-xs mt-1">{errors.purchaseCost.message}</p>}
        </div>

        {/* Target Sale Price */}
        <div>
          <label className="form-label">Target Sale Price (BDS$)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              className="form-input pl-8"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('targetSalePrice')}
            />
          </div>
          {errors.targetSalePrice && <p className="text-red-500 text-xs mt-1">{errors.targetSalePrice.message}</p>}
        </div>

        {/* Partners */}
        <div>
          <label className="form-label">Partners Contributing *</label>
          <select className="form-input" {...register('partners')}>
            <option value="">Select partners</option>
            {PARTNER_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {errors.partners && <p className="text-red-500 text-xs mt-1">{errors.partners.message}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="form-label">Notes</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Any additional notes..."
            {...register('notes')}
          />
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{serverError}</p>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <><Spinner /> Saving...</> : 'Add Vehicle to Inventory'}
        </button>
      </form>
    </FormWrapper>
  );
}
