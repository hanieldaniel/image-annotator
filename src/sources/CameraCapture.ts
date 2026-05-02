export async function captureFromCamera(root: ShadowRoot | Document = document): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true })

  return new Promise((resolve, reject) => {
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999'

    const video = document.createElement('video')
    video.srcObject = stream
    video.autoplay = true
    video.playsInline = true
    video.style.cssText = 'max-width:100%;max-height:80vh'

    const btn = document.createElement('button')
    btn.textContent = 'Capture'
    btn.style.cssText = 'margin-top:16px;padding:10px 28px;font-size:16px;cursor:pointer'

    container.appendChild(video)
    container.appendChild(btn)

    if (root instanceof ShadowRoot) root.appendChild(container)
    else document.body.appendChild(container)

    const cleanup = () => {
      stream.getTracks().forEach((t) => t.stop())
      container.remove()
    }

    btn.addEventListener('click', () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      cleanup()
      resolve(canvas.toDataURL('image/png'))
    })

    video.addEventListener('error', () => { cleanup(); reject(new Error('Camera error')) })
  })
}
