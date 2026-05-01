import html2canvas from 'html2canvas'

export async function captureFromDom(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, { useCORS: true, allowTaint: true })
  return canvas.toDataURL('image/png')
}
