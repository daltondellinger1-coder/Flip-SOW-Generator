import { useSOW } from '../../context/SOWContext'
import FormField from '../ui/FormField'
import Button from '../ui/Button'

export default function ProjectOverviewStep() {
  const { state, dispatch } = useSOW()

  const update = (e) => {
    dispatch({ type: 'UPDATE_FIELD', field: e.target.name, value: e.target.value })
  }

  const updateObjective = (index, value) => {
    dispatch({ type: 'UPDATE_SIMPLE_LIST_ITEM', field: 'objectives', index, value })
  }

  const addObjective = () => {
    dispatch({ type: 'ADD_SIMPLE_LIST_ITEM', field: 'objectives' })
  }

  const removeObjective = (index) => {
    dispatch({ type: 'REMOVE_SIMPLE_LIST_ITEM', field: 'objectives', index })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Project Overview</h2>
      <p className="text-sm text-gray-500">Describe the project and its key objectives.</p>

      <FormField
        label="Project Name"
        name="projectName"
        value={state.projectName}
        onChange={update}
        placeholder="Website Redesign Project"
        required
      />
      <FormField
        label="Project Description"
        name="projectDescription"
        value={state.projectDescription}
        onChange={update}
        placeholder="Provide a brief overview of the project..."
        multiline
        rows={4}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Project Objectives</label>
        {state.objectives.map((obj, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={obj}
              onChange={(e) => updateObjective(i, e.target.value)}
              placeholder={`Objective ${i + 1}`}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-flip-500 focus:ring-1 focus:ring-flip-500 outline-none"
            />
            {state.objectives.length > 1 && (
              <button
                type="button"
                onClick={() => removeObjective(i)}
                className="text-gray-400 hover:text-red-500 px-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        <Button variant="secondary" type="button" onClick={addObjective}>
          + Add Objective
        </Button>
      </div>
    </div>
  )
}
