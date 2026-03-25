import { useSOW } from '../../context/SOWContext'
import { formatCurrency } from '../../utils/formatCurrency'

export default function SOWPreview() {
  const { state } = useSOW()

  const grandTotal = state.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div
      id="sow-document"
      className="bg-white p-8 text-gray-800 text-sm leading-relaxed"
      style={{ minHeight: '600px' }}
    >
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-blue-800 tracking-tight">
          STATEMENT OF WORK
        </h1>
        <div className="flex justify-between mt-2 text-gray-600 text-xs">
          <span>{state.companyName || 'Your Company'}</span>
          <span>{formatDate(state.sowDate)}</span>
        </div>
      </div>

      {/* Client Info */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
          Prepared For
        </h2>
        <div className="text-gray-700 space-y-0.5">
          <p className="font-medium">{state.clientName || 'Client Name'}</p>
          {state.clientEmail && <p>{state.clientEmail}</p>}
          {state.clientPhone && <p>{state.clientPhone}</p>}
          {state.clientAddress && (
            <p className="whitespace-pre-line">{state.clientAddress}</p>
          )}
        </div>
      </section>

      {/* Project Overview */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
          Project Overview
        </h2>
        <h3 className="text-base font-semibold mb-1">
          {state.projectName || 'Project Name'}
        </h3>
        <p className="text-gray-700 whitespace-pre-line">
          {state.projectDescription || 'Project description will appear here.'}
        </p>

        {state.objectives.some((o) => o.trim()) && (
          <div className="mt-3">
            <p className="font-medium text-gray-800 mb-1">Objectives:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              {state.objectives
                .filter((o) => o.trim())
                .map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
            </ul>
          </div>
        )}
      </section>

      {/* Scope of Work */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
          Scope of Work
        </h2>
        {state.deliverables.some((d) => d.title.trim()) ? (
          <div className="space-y-3">
            {state.deliverables
              .filter((d) => d.title.trim())
              .map((d, i) => (
                <div key={i}>
                  <p className="font-medium">
                    {i + 1}. {d.title}
                  </p>
                  {d.description && (
                    <p className="text-gray-600 ml-4 whitespace-pre-line">
                      {d.description}
                    </p>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-400 italic">No deliverables defined yet.</p>
        )}
      </section>

      {/* Timeline */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
          Timeline & Milestones
        </h2>
        {state.phases.some((p) => p.name.trim()) ? (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border border-gray-200">Phase</th>
                <th className="text-left p-2 border border-gray-200">Start</th>
                <th className="text-left p-2 border border-gray-200">End</th>
                <th className="text-left p-2 border border-gray-200">Description</th>
              </tr>
            </thead>
            <tbody>
              {state.phases
                .filter((p) => p.name.trim())
                .map((p, i) => (
                  <tr key={i}>
                    <td className="p-2 border border-gray-200 font-medium">{p.name}</td>
                    <td className="p-2 border border-gray-200">{formatDate(p.startDate)}</td>
                    <td className="p-2 border border-gray-200">{formatDate(p.endDate)}</td>
                    <td className="p-2 border border-gray-200">{p.description}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 italic">No timeline defined yet.</p>
        )}
      </section>

      {/* Pricing */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
          Pricing
        </h2>
        {state.lineItems.some((li) => li.description.trim()) ? (
          <>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border border-gray-200">Description</th>
                  <th className="text-right p-2 border border-gray-200">Qty</th>
                  <th className="text-right p-2 border border-gray-200">Unit Price</th>
                  <th className="text-right p-2 border border-gray-200">Amount</th>
                </tr>
              </thead>
              <tbody>
                {state.lineItems
                  .filter((li) => li.description.trim())
                  .map((li, i) => (
                    <tr key={i}>
                      <td className="p-2 border border-gray-200">{li.description}</td>
                      <td className="p-2 border border-gray-200 text-right">{li.quantity}</td>
                      <td className="p-2 border border-gray-200 text-right">
                        {formatCurrency(li.unitPrice)}
                      </td>
                      <td className="p-2 border border-gray-200 text-right font-medium">
                        {formatCurrency(li.quantity * li.unitPrice)}
                      </td>
                    </tr>
                  ))}
                <tr className="bg-blue-50 font-bold">
                  <td colSpan={3} className="p-2 border border-gray-200 text-right">
                    Total
                  </td>
                  <td className="p-2 border border-gray-200 text-right">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>

            {state.paymentSchedule && (
              <p className="mt-2 text-gray-700">
                <span className="font-medium">Payment Terms:</span>{' '}
                {state.paymentSchedule}
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-400 italic">No pricing defined yet.</p>
        )}
      </section>

      {/* Terms */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
          Terms & Conditions
        </h2>
        <div className="text-gray-700 whitespace-pre-line text-xs leading-relaxed">
          {state.termsAndConditions}
        </div>
      </section>

      {/* Signature Block */}
      <section className="mt-10 pt-6 border-t border-gray-300">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold text-gray-800 mb-8">
              {state.companyName || 'Service Provider'}
            </p>
            <div className="border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Signature / Date</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 mb-8">
              {state.clientName || 'Client'}
            </p>
            <div className="border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Signature / Date</p>
          </div>
        </div>
      </section>
    </div>
  )
}
