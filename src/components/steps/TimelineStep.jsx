import { useSOW } from '../../context/SOWContext'
import FormField from '../ui/FormField'
import DynamicList from '../ui/DynamicList'

export default function TimelineStep() {
  const { state, dispatch } = useSOW()

  const addPhase = () => {
    dispatch({
      type: 'ADD_LIST_ITEM',
      field: 'phases',
      template: { name: '', startDate: '', endDate: '', description: '' },
    })
  }

  const removePhase = (index) => {
    dispatch({ type: 'REMOVE_LIST_ITEM', field: 'phases', index })
  }

  const updatePhase = (index, key, value) => {
    dispatch({
      type: 'UPDATE_LIST_ITEM',
      field: 'phases',
      index,
      value: { [key]: value },
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Timeline & Milestones</h2>
      <p className="text-sm text-gray-500">Define the project phases and their timelines.</p>

      <DynamicList
        items={state.phases}
        onAdd={addPhase}
        onRemove={removePhase}
        addLabel="Add Phase"
        renderItem={(item, index) => (
          <div className="space-y-3 pr-6">
            <FormField
              label={`Phase ${index + 1} Name`}
              name={`phase-name-${index}`}
              value={item.name}
              onChange={(e) => updatePhase(index, 'name', e.target.value)}
              placeholder="e.g., Discovery & Planning"
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Start Date"
                name={`phase-start-${index}`}
                type="date"
                value={item.startDate}
                onChange={(e) => updatePhase(index, 'startDate', e.target.value)}
              />
              <FormField
                label="End Date"
                name={`phase-end-${index}`}
                type="date"
                value={item.endDate}
                onChange={(e) => updatePhase(index, 'endDate', e.target.value)}
              />
            </div>
            <FormField
              label="Description"
              name={`phase-desc-${index}`}
              value={item.description}
              onChange={(e) => updatePhase(index, 'description', e.target.value)}
              placeholder="What happens during this phase..."
              multiline
              rows={2}
            />
          </div>
        )}
      />
    </div>
  )
}
