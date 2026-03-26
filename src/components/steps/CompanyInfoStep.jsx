import { useSOW } from '../../context/SOWContext'
import FormField from '../ui/FormField'

export default function CompanyInfoStep() {
  const { state, dispatch } = useSOW()

  const update = (e) => {
    dispatch({ type: 'UPDATE_FIELD', field: e.target.name, value: e.target.value })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Company & Client Information</h2>
      <p className="text-sm text-gray-500">Enter the details for both parties involved in this SOW.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Your Company Name"
          name="companyName"
          value={state.companyName}
          onChange={update}
          placeholder="Flip Inc."
          required
        />
        <FormField
          label="SOW Date"
          name="sowDate"
          type="date"
          value={state.sowDate}
          onChange={update}
          required
        />
      </div>

      <hr className="border-gray-200" />
      <h3 className="text-md font-medium text-gray-800">Client Details</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Client Name"
          name="clientName"
          value={state.clientName}
          onChange={update}
          placeholder="Jane Smith"
          required
        />
        <FormField
          label="Client Email"
          name="clientEmail"
          type="email"
          value={state.clientEmail}
          onChange={update}
          placeholder="jane@company.com"
        />
        <FormField
          label="Client Phone"
          name="clientPhone"
          type="tel"
          value={state.clientPhone}
          onChange={update}
          placeholder="(555) 123-4567"
        />
      </div>
      <FormField
        label="Client Address"
        name="clientAddress"
        value={state.clientAddress}
        onChange={update}
        placeholder="123 Main St, City, State ZIP"
        multiline
        rows={2}
      />
    </div>
  )
}
