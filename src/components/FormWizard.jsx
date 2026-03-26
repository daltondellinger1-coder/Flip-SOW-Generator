import { useState } from 'react'
import StepIndicator from './ui/StepIndicator'
import Button from './ui/Button'
import CompanyInfoStep from './steps/CompanyInfoStep'
import ProjectOverviewStep from './steps/ProjectOverviewStep'
import ScopeOfWorkStep from './steps/ScopeOfWorkStep'
import TimelineStep from './steps/TimelineStep'
import PricingStep from './steps/PricingStep'
import TermsStep from './steps/TermsStep'
import { exportSOWToPdf } from '../utils/exportPdf'
import { useSOW } from '../context/SOWContext'

const stepComponents = [
  CompanyInfoStep,
  ProjectOverviewStep,
  ScopeOfWorkStep,
  TimelineStep,
  PricingStep,
  TermsStep,
]

export default function FormWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [exporting, setExporting] = useState(false)
  const { state } = useSOW()

  const StepComponent = stepComponents[currentStep]
  const isLastStep = currentStep === stepComponents.length - 1

  const handleExport = async () => {
    setExporting(true)
    try {
      const filename = state.projectName
        ? `SOW-${state.projectName.replace(/\s+/g, '-')}.pdf`
        : 'Statement-of-Work.pdf'
      await exportSOWToPdf(filename)
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <StepIndicator currentStep={currentStep} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <StepComponent />

        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex gap-3">
            {isLastStep && (
              <Button
                variant="success"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? 'Generating PDF...' : 'Export PDF'}
              </Button>
            )}
            {!isLastStep && (
              <Button onClick={() => setCurrentStep((s) => s + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
