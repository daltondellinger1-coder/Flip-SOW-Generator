import { useSOW } from '../../context/SOWContext'
import { defaultTerms } from '../../utils/defaultTerms'
import Button from '../ui/Button'

export default function TermsStep() {
  const { state, dispatch } = useSOW()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Terms & Conditions</h2>
          <p className="text-sm text-gray-500">Review and customize the terms for this SOW.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            dispatch({ type: 'UPDATE_FIELD', field: 'termsAndConditions', value: defaultTerms })
          }
        >
          Reset to Default
        </Button>
      </div>

      <textarea
        value={state.termsAndConditions}
        onChange={(e) =>
          dispatch({
            type: 'UPDATE_FIELD',
            field: 'termsAndConditions',
            value: e.target.value,
          })
        }
        rows={20}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-flip-500 focus:ring-1 focus:ring-flip-500 outline-none font-mono"
      />
    </div>
  )
}
