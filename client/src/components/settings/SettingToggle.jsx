import { motion } from "framer-motion";

export const SettingToggle = ({ label, description, checked, onChange, disabled = false }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <h4 className={`font-semibold ${disabled ? 'text-text-secondary' : 'text-text-primary'}`}>{label}</h4>
        {description && (
          <p className="text-sm text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-base ${
          checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="sr-only">Toggle {label}</span>
        <motion.span
          layout
          initial={false}
          animate={{
            x: checked ? 20 : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0"
        />
      </button>
    </div>
  );
};
