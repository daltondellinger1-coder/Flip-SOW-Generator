import { useState } from 'react'
import { SOWProvider } from './context/SOWContext'
import FormWizard from './components/FormWizard'
import SOWPreview from './components/preview/SOWPreview'
import DraftManager from './components/DraftManager'

export default function App() {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <SOWProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-flip-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900">
                Flip <span className="text-flip-600">SOW Generator</span>
              </h1>
            </div>

            {/* Mobile preview toggle */}
            <button
              className="lg:hidden text-sm font-medium text-flip-600 border border-flip-200 rounded-lg px-3 py-1.5 hover:bg-flip-50"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Edit Form' : 'Preview'}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex gap-6">
            {/* Left: Form */}
            <div
              className={`flex-1 min-w-0 ${showPreview ? 'hidden lg:block' : ''}`}
            >
              <DraftManager />
              <FormWizard />
            </div>

            {/* Right: Preview */}
            <div
              className={`lg:w-[480px] lg:flex-shrink-0 ${
                showPreview ? '' : 'hidden lg:block'
              }`}
            >
              <div className="sticky top-20">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Live Preview
                  </h2>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto">
                  <SOWPreview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SOWProvider>
  )
}
