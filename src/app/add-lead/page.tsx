'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormWrapper from '@/components/FormWrapper';
import SuccessMessage from '@/components/SuccessMessage';
import Spinner from '@/components/Spinner';
import { MAKES, MODELS, YEARS, LEAD_SOURCES, formatBDS } from '@/lib/constants';

const schema = z.object({
  prospectName: z.string().min(1, 'Prospect name is required'),
  phone: z.string().optional(),
  year: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  budget: z.string().optional().refine(v => !v || parseFloat(v) > 0, 'Must be a positive number'),
  source: z.string().optional(),
  quotedPrice: z.string().optional().refine(v => !v || parseFloat(v) > 0, 'Must be a positive number'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SuccessData {
  leadId: string;
  prospectName: string;
  vehicle: string;
  budget?: string;
}

export default function AddLead() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const year = watch('year');
  const make = watch('make');
  const model = watch('model');
  const trim = watch('trim');
  const vehicleStr = [year, make, model, trim].filter(Boolean).join(' ');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save lead');
      setSuccess({
        leadId: json.leadId,
        prospectName: data.prospectName,
        vehicle: vehicleStr || 'Not specified',
        budget: data.budget,
      });
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const items = [
      { label: 'Lead ID', value: success.leadId },
      { label: 'Prospect', value: success.prospectName },
      { label: 'Vehicle Interest', value: success.vehicle },
      { label: 'Status', value: 'New' },
    ];
    if (success.budget) {
      items.push({ label: 'Budget', value: formatBDS(parseFloat(success.budget)) });
    }
    return (
      <SuccessMessage
        title="Lead Added!"
        items={items}
        onReset={() => { setSuccess(null); reset(); }}
        resetLabel="Add Another Lead"
      />
    );
  }

  return (
    <FormWrapper title="Add Lead" subtitle="Track a potential customer inquiry">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Prospect Name */}
        <div>
          <label className="form-label">Prospect Name *</label>
          <input className="form-input" type="text" placeholder="Full name" {...register('prospectName')} />
          {errors.prospectName && <p className="text-red-500 text-xs mt-1">{errors.prospectName.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="form-label">Phone / WhatsApp</label>
          <input className="form-input" type="tel" placeholder="+1 246 XXX XXXX" {...register('phone')} />
        </div>

        {/* Vehicle Interest */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle Interest</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Year</label>
              <select className="form-input" {...register('year')}>
                <option value="">Any</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Make</label>
              <select className="form-input" {...register('make')}>
                <option value="">Any</option>
                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Model</label>
              <select className="form-input" {...register('model')}>
                <option value="">Any</option>
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Trim</label>
              <input className="form-input" type="text" placeholder="e.g. RS" {...register('trim')} />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="form-label">Budget (BDS$)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              className="form-input pl-8"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('budget')}
            />
          </div>
          {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget.message}</p>}
        </div>

        {/* Source */}
        <div>
          <label className="form-label">Source</label>
          <select className="form-input" {...register('source')}>
            <option value="">Select source</option>
            {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Quoted Price */}
        <div>
          <label className="form-label">Quoted Price (BDS$)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              className="form-input pl-8"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('quotedPrice')}
            />
          </div>
          {errors.quotedPrice && <p className="text-red-500 text-xs mt-1">{errors.quotedPrice.message}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-input" rows={3} placeholder="Details about the inquiry..." {...register('notes')} />
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{serverError}</p>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <><Spinner /> Saving...</> : 'Add Lead'}
        </button>
      </form>
    </FormWrapper>
  );
}
