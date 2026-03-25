import html2pdf from 'html2pdf.js'

export function exportSOWToPdf(filename = 'Statement-of-Work.pdf') {
  const element = document.getElementById('sow-document')
  if (!element) return

  const opt = {
    margin: 10,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  return html2pdf().set(opt).from(element).save()
}
