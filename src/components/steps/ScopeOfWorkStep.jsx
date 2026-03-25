import { useSOW } from '../../context/SOWContext'
import FormField from '../ui/FormField'
import DynamicList from '../ui/DynamicList'

export default function ScopeOfWorkStep() {
  const { state, dispatch } = useSOW()

  const addDeliverable = () => {
    dispatch({
      type: 'ADD_LIST_ITEM',
      field: 'deliverables',
      template: { title: '', description: '' },
    })
  }

  const removeDeliverable = (index) => {
    dispatch({ type: 'REMOVE_LIST_ITEM', field: 'deliverables', index })
  }

  const updateDeliverable = (index, key, value) => {
    dispatch({
      type: 'UPDATE_LIST_ITEM',
      field: 'deliverables',
      index,
      value: { [key]: value },
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Scope of Work</h2>
      <p className="text-sm text-gray-500">Define the deliverables for this project.</p>

      <DynamicList
        items={state.deliverables}
        onAdd={addDeliverable}
        onRemove={removeDeliverable}
        addLabel="Add Deliverable"
        renderItem={(item, index) => (
          <div className="space-y-3 pr-6">
            <FormField
              label={`Deliverable ${index + 1}`}
              name={`deliverable-title-${index}`}
              value={item.title}
              onChange={(e) => updateDeliverable(index, 'title', e.target.value)}
              placeholder="e.g., Homepage Design"
            />
            <FormField
              label="Description"
              name={`deliverable-desc-${index}`}
              value={item.description}
              onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
              placeholder="Describe what this deliverable includes..."
              multiline
              rows={2}
            />
          </div>
        )}
      />
    </div>
  )
}
