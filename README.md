# React Paper Viewer

```sh
$ yarn add react-paper-viewer
```

```tsx
import { useRef } from 'react'
import { PaperViewer } from 'react-paper-viewer'
import type { PaperViewerToCanvas } from './components/PaperViewer'

function App() {
  const toCanvasRef = useRef<PaperViewerToCanvas>()
  const download = async () => {
    if (!toCanvasRef.current) return

    const canvas = await toCanvasRef.current()
    const dataURL = canvas.toDataURL()
    const a = document.createElement('a')
    a.download = 'sample.png'
    a.href = dataURL
    a.click()
  }

  return (
    <>
      <PaperViewer
        src="/src/logo.svg"
        onInit={({ toCanvas }) => {
          toCanvasRef.current = toCanvas
        }}
      />
      <button onClick={download}>Download</button>
    </>
  )
}

export default App
```
