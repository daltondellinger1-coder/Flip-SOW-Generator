import { useSOW } from '../../context/SOWContext'
import FormField from '../ui/FormField'
import DynamicList from '../ui/DynamicList'
import { formatCurrency } from '../../utils/formatCurrency'

export default function PricingStep() {
  const { state, dispatch } = useSOW()

  const addLineItem = () => {
    dispatch({
      type: 'ADD_LIST_ITEM',
      field: 'lineItems',
      template: { description: '', quantity: 1, unitPrice: 0 },
    })
  }

  const removeLineItem = (index) => {
    dispatch({ type: 'REMOVE_LIST_ITEM', field: 'lineItems', index })
  }

  const updateLineItem = (index, key, value) => {
    dispatch({
      type: 'UPDATE_LIST_ITEM',
      field: 'lineItems',
      index,
      value: { [key]: key === 'description' ? value : Number(value) || 0 },
    })
  }

  const grandTotal = state.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Pricing & Payment Terms</h2>
      <p className="text-sm text-gray-500">Add line items and define payment terms.</p>

      <DynamicList
        items={state.lineItems}
        onAdd={addLineItem}
        onRemove={removeLineItem}
        addLabel="Add Line Item"
        renderItem={(item, index) => (
          <div className="space-y-3 pr-6">
            <FormField
              label={`Item ${index + 1} Description`}
              name={`item-desc-${index}`}
              value={item.description}
              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
              placeholder="e.g., Frontend Development"
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField
                label="Quantity"
                name={`item-qty-${index}`}
                type="number"
                value={item.quantity}
                onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
              />
              <FormField
                label="Unit Price ($)"
                name={`item-price-${index}`}
                type="number"
                value={item.unitPrice}
                onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Subtotal</label>
                <div className="px-3 py-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <div className="flex justify-end">
        <div className="bg-flip-50 border border-flip-200 rounded-lg px-6 py-3">
          <span className="text-sm text-flip-700 font-medium">Grand Total: </span>
          <span className="text-lg font-bold text-flip-800">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <FormField
        label="Payment Schedule"
        name="paymentSchedule"
        value={state.paymentSchedule}
        onChange={(e) =>
          dispatch({ type: 'UPDATE_FIELD', field: 'paymentSchedule', value: e.target.value })
        }
        placeholder="e.g., 50% upfront, 50% upon completion"
        multiline
        rows={2}
      />
    </div>
  )
}
