export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  multiline = false,
  rows = 3,
  required = false,
}) {
  const inputClasses =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-flip-500 focus:ring-1 focus:ring-flip-500 outline-none transition-colors'

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={inputClasses}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
    </div>
  )
}
