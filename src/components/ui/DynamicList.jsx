import Button from './Button'

export default function DynamicList({
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = 'Add Item',
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="relative border border-gray-200 rounded-lg p-4 bg-gray-50"
        >
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {renderItem(item, index)}
        </div>
      ))}
      <Button variant="secondary" type="button" onClick={onAdd}>
        + {addLabel}
      </Button>
    </div>
  )
}
