import { Annotator } from '@hanieldaniel/img-marker'

const annotator = new Annotator()
let activePreview: HTMLElement | null = null

function showPreview(container: HTMLElement, blob: Blob) {
  const url = URL.createObjectURL(blob)
  container.innerHTML = ''
  const img = document.createElement('img')
  img.src = url
  img.alt = 'Annotated result'
  container.appendChild(img)
}

annotator.on('save', (blob) => {
  if (activePreview) showPreview(activePreview, blob)
  annotator.close()
})

annotator.on('cancel', () => {
  annotator.close()
})

// 1. File upload
const fileBtn = document.getElementById('file-btn') as HTMLButtonElement
const fileInput = document.getElementById('file-input') as HTMLInputElement
const filePreview = document.getElementById('file-preview') as HTMLElement

fileBtn.addEventListener('click', () => fileInput.click())

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0]
  if (!file) return
  activePreview = filePreview
  annotator.open({ type: 'file', file })
  fileInput.value = ''
})

// 2. Screenshot (drag-to-select region)
const domBtn = document.getElementById('dom-btn') as HTMLButtonElement
const domPreview = document.getElementById('dom-preview') as HTMLElement

domBtn.addEventListener('click', () => {
  activePreview = domPreview
  annotator.open({ type: 'screenshot' })
})

// 3. Camera
const cameraBtn = document.getElementById('camera-btn') as HTMLButtonElement
const cameraPreview = document.getElementById('camera-preview') as HTMLElement

cameraBtn.addEventListener('click', () => {
  activePreview = cameraPreview
  annotator.open({ type: 'camera' })
})
