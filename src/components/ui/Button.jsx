const variants = {
  primary:
    'bg-flip-600 hover:bg-flip-700 text-white focus:ring-flip-500',
  secondary:
    'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-flip-500',
  danger:
    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  success:
    'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
