import { useState, useEffect } from 'react'
import { useSOW } from '../context/SOWContext'
import { saveDraft, loadDraft, listDrafts, deleteDraft } from '../hooks/useLocalStorage'
import Button from './ui/Button'

export default function DraftManager() {
  const { state, dispatch } = useSOW()
  const [drafts, setDrafts] = useState([])
  const [draftName, setDraftName] = useState('')
  const [showDrafts, setShowDrafts] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    setDrafts(listDrafts())
  }, [])

  const handleSave = () => {
    const name = draftName.trim() || `Draft ${new Date().toLocaleString()}`
    saveDraft(name, state)
    setDrafts(listDrafts())
    setDraftName('')
    setSaveMessage('Saved!')
    setTimeout(() => setSaveMessage(''), 2000)
  }

  const handleLoad = (name) => {
    const data = loadDraft(name)
    if (data) {
      dispatch({ type: 'LOAD_DRAFT', data })
    }
  }

  const handleDelete = (name) => {
    deleteDraft(name)
    setDrafts(listDrafts())
  }

  const handleReset = () => {
    dispatch({ type: 'RESET' })
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Draft name..."
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-flip-500 focus:ring-1 focus:ring-flip-500 outline-none min-w-0 flex-1"
        />
        <Button variant="primary" onClick={handleSave} className="text-xs whitespace-nowrap">
          Save Draft
        </Button>
        {saveMessage && (
          <span className="text-green-600 text-xs font-medium">{saveMessage}</span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative">
          <Button
            variant="secondary"
            onClick={() => setShowDrafts(!showDrafts)}
            className="text-xs"
          >
            Load Draft ({drafts.length})
          </Button>
          {showDrafts && drafts.length > 0 && (
            <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64 max-h-48 overflow-y-auto">
              {drafts.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <button
                    className="text-sm text-gray-700 hover:text-flip-600 truncate flex-1 text-left"
                    onClick={() => {
                      handleLoad(d.name)
                      setShowDrafts(false)
                    }}
                  >
                    {d.name}
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
                    onClick={() => handleDelete(d.name)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button variant="danger" onClick={handleReset} className="text-xs">
          New SOW
        </Button>
      </div>
    </div>
  )
}
