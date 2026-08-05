export const SettingSelect = ({ label, description, value, options, onChange, disabled = false }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
      <div className="flex-1 pr-4">
        <h4 className={`font-semibold ${disabled ? 'text-text-secondary' : 'text-text-primary'}`}>{label}</h4>
        {description && (
          <p className="text-sm text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0 w-full sm:w-48">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-bg-base border border-border-soft text-text-primary text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
