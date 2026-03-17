interface SuccessMessageProps {
  title: string;
  items: { label: string; value: string }[];
  onReset: () => void;
  resetLabel?: string;
}

export default function SuccessMessage({ title, items, onReset, resetLabel = 'Add Another' }: SuccessMessageProps) {
  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="card text-center py-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#dcfce7' }}
        >
          <svg className="w-8 h-8" style={{ color: '#198a4a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <div className="text-left bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          {items.map(item => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-gray-500">{item.label}</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">{item.value}</span>
            </div>
          ))}
        </div>
        <button onClick={onReset} className="btn-primary">
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
