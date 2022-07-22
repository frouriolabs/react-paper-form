import * as html2canvas from 'html2canvas'
import type { PropsWithChildren } from 'react'
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

export type PaperViewerToCanvas = () => Promise<HTMLCanvasElement>
export type PaperViewerInit = (params: { toCanvas: PaperViewerToCanvas }) => void

const containerStyle: React.CSSProperties = {
  position: 'relative',
  height: '100%',
  overflow: 'hidden',
  cursor: 'move',
  userSelect: 'none',
  background: '#555',
}

const viewerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
}

const frontPanelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
}

const calcDistance = (touches: React.TouchList) =>
  ((touches[0].pageX - touches[1].pageX) ** 2 + (touches[0].pageY - touches[1].pageY) ** 2) ** 0.5

export const PaperViewer = (
  props: PropsWithChildren<{
    src: string
    zoomMax?: number
    zoomMin?: number
    onInit?: PaperViewerInit
  }>
) => {
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 })
  const containerRef = useRef<HTMLDivElement>(null)
  const html2canvasRef = useRef<HTMLDivElement>(null)
  const [viewerWidth, setViewerWidth] = useState(0)
  const aspect = useMemo(() => naturalSize.width / naturalSize.height, [naturalSize])
  const viewerHeight = useMemo(() => viewerWidth / aspect, [viewerWidth, aspect])
  const [scale, setScale] = useState(1)
  const [prevPanPoint, setPrevPanPoint] = useState<{ x: number; y: number } | null>(null)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [baseDistance, setBaseDistance] = useState(0)
  const clampTranslate = (scale: number, translate: { x: number; y: number }) => ({
    x: Math.max(viewerWidth / 2 - viewerWidth * scale, Math.min(viewerWidth / 2, translate.x)),
    y: Math.max(viewerHeight / 2 - viewerHeight * scale, Math.min(viewerHeight / 2, translate.y)),
  })
  const onZoom = (pointX: number, pointY: number, scaleDelta: number) => {
    const newScale = Math.min(
      props.zoomMax ?? 5,
      Math.max(props.zoomMin ?? 0.8, scale + scaleDelta)
    )
    setScale(newScale)
    setTranslate(
      clampTranslate(newScale, {
        x: translate.x - (newScale - scale) * pointX,
        y: translate.y - (newScale - scale) * pointY,
      })
    )
  }
  const onMouseDown = (e: React.MouseEvent) => {
    setPrevPanPoint({ x: e.pageX, y: e.pageY })
  }
  const onMouseMove = (e: { pageX: number; pageY: number }) => {
    if (!prevPanPoint) return

    const currentPanPoint = { x: e.pageX, y: e.pageY }
    setTranslate(
      clampTranslate(scale, {
        x: translate.x + (currentPanPoint.x - prevPanPoint.x),
        y: translate.y + (currentPanPoint.y - prevPanPoint.y),
      })
    )
    setPrevPanPoint(currentPanPoint)
  }
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setPrevPanPoint({ x: e.touches[0].pageX, y: e.touches[0].pageY })
    } else if (e.touches.length === 2) {
      setPrevPanPoint(null)
      setBaseDistance(calcDistance(e.touches) / scale)
    }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      onMouseMove(e.touches[0])
    } else if (e.touches.length === 2) {
      const rect = e.currentTarget.getBoundingClientRect()

      onZoom(
        ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / scale,
        ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) / scale,
        calcDistance(e.touches) / baseDistance - scale
      )
    }
  }
  const onWheel = (e: React.WheelEvent) => {
    onZoom(e.nativeEvent.offsetX, e.nativeEvent.offsetY, e.deltaY < 0 ? 0.2 : -0.2)
  }

  useLayoutEffect(() => {
    const img = new Image()
    img.onload = () => setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    img.src = props.src
  }, [props.src])

  useLayoutEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault()
    const onMouseup = () => setPrevPanPoint(null)
    const onTouchend = (e: TouchEvent) => {
      if (e.touches.length === 0) setPrevPanPoint(null)
    }

    window.addEventListener('mouseup', onMouseup, false)
    window.addEventListener('touchend', onTouchend, false)
    containerRef.current?.addEventListener('wheel', preventDefault, { passive: false })
    containerRef.current?.addEventListener('touchstart', preventDefault, { passive: false })

    return () => {
      window.removeEventListener('mouseup', onMouseup, false)
      window.removeEventListener('touchend', onTouchend, false)
    }
  }, [])

  useLayoutEffect(() => {
    const resize = () => {
      if (!containerRef.current) return

      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      const newViewerWidth = w / h > aspect ? h * aspect : w

      if (viewerWidth === newViewerWidth) return // for resizing address bar of iOS15 safari

      setViewerWidth(newViewerWidth)
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    }
    window.addEventListener('resize', resize, false)
    resize()

    return () => window.removeEventListener('resize', resize, false)
  }, [aspect, viewerWidth])

  useEffect(() => {
    if (!props.onInit) return

    props.onInit({
      toCanvas: async () => {
        if (!html2canvasRef.current || !html2canvasRef.current.parentElement) {
          throw new Error('Viewer does not exist.')
        }

        const currentTransform = html2canvasRef.current.style.transform
        const parentTransform = html2canvasRef.current.parentElement.style.transform

        html2canvasRef.current.style.transform = ''
        html2canvasRef.current.parentElement.style.transform = ''
        const canvas = await html2canvas.default(html2canvasRef.current)
        html2canvasRef.current.style.transform = currentTransform
        html2canvasRef.current.parentElement.style.transform = parentTransform

        return canvas
      },
    })
  }, [props])

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={{ ...viewerStyle, width: `${viewerWidth}px`, height: `${viewerHeight}px` }}>
        <div
          style={{
            boxShadow: '0 0 8px 8px #2227',
            transformOrigin: 'left top',
            width: `${viewerWidth}px`,
            height: `${viewerHeight}px`,
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
        >
          <div
            ref={html2canvasRef}
            style={{
              position: 'relative',
              transformOrigin: 'left top',
              width: `${naturalSize.width}px`,
              height: `${naturalSize.height}px`,
              background: `center/contain no-repeat url(${props.src})`,
              transform: `scale(${viewerWidth / naturalSize.width})`,
            }}
          >
            {props.children}
          </div>
          <div
            style={frontPanelStyle}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
          />
        </div>
      </div>
    </div>
  )
}
