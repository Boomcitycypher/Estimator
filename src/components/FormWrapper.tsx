interface FormWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function FormWrapper({ title, subtitle, children }: FormWrapperProps) {
  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="card">
        {children}
      </div>
    </div>
  );
}
