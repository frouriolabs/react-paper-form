import type { PropsWithChildren } from 'react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
  cursor: move;
  user-select: none;
  background: #555;
`

const Viewer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

const TransformContainer = styled.div<{ src: string }>`
  background: center/contain no-repeat url(${(props) => props.src});
  box-shadow: 0 0 8px 8px #2227;
  transform-origin: left top;
`

const ShapeContainer = styled.div<{
  scale: number
  naturalSize: { width: number; height: number }
}>`
  position: relative;
  width: ${(props) => props.naturalSize.width}px;
  height: ${(props) => props.naturalSize.height}px;
  transform: scale(${(props) => props.scale});
  transform-origin: left top;
`

const FrontPanel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const ZOOM_MAX = 3
const calcDistance = (touches: React.TouchList) =>
  ((touches[0].pageX - touches[1].pageX) ** 2 + (touches[0].pageY - touches[1].pageY) ** 2) ** 0.5

export const PaperViewer = (props: PropsWithChildren<{ src: string }>) => {
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 })
  const containerRef = useRef<HTMLDivElement>(null)
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
    const newScale = Math.min(ZOOM_MAX, Math.max(0.8, scale + scaleDelta))
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
  const onTouchPanStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) setPrevPanPoint({ x: e.touches[0].pageX, y: e.touches[0].pageY })
  }
  const onTouchPanMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) onMouseMove(e.touches[0])
  }
  const onTouchZoomStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return
    e.stopPropagation()
    setPrevPanPoint(null)
    setBaseDistance(calcDistance(e.touches) / scale)
  }
  const onTouchZoomMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return
    e.stopPropagation()
    onZoom(
      (e.touches[0].clientX + e.touches[1].clientX) / 2,
      (e.touches[0].clientY + e.touches[1].clientY) / 2,
      calcDistance(e.touches) / baseDistance - scale
    )
  }
  const onWheel = (e: React.WheelEvent) => {
    onZoom(e.nativeEvent.offsetX, e.nativeEvent.offsetY, e.deltaY < 0 ? 0.2 : -0.2)
  }

  useEffect(() => {
    const img = new Image()
    img.onload = () => setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    img.src = props.src
  }, [props.src])

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault()
    const onMouseup = () => setPrevPanPoint(null)
    const onTouchend = (e: TouchEvent) => {
      if (e.touches.length === 0) setPrevPanPoint(null)
    }

    window.addEventListener('mouseup', onMouseup, false)
    window.addEventListener('touchend', onTouchend, false)
    containerRef.current?.addEventListener('wheel', preventDefault, false)
    containerRef.current?.addEventListener('touchstart', preventDefault, false)

    return () => {
      window.removeEventListener('mouseup', onMouseup, false)
      window.removeEventListener('touchend', onTouchend, false)
    }
  }, [])

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return

      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      setViewerWidth(w / h > aspect ? h * aspect : w)
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    }
    window.addEventListener('resize', resize, false)
    resize()

    return () => window.removeEventListener('resize', resize, false)
  }, [aspect])

  return (
    <Container
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchPanStart}
      onTouchMove={onTouchPanMove}
    >
      <Viewer style={{ width: `${viewerWidth}px`, height: `${viewerHeight}px` }}>
        <TransformContainer
          src={props.src}
          style={{
            width: `${viewerWidth}px`,
            height: `${viewerHeight}px`,
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
        >
          <ShapeContainer scale={viewerWidth / naturalSize.width} naturalSize={naturalSize}>
            {props.children}
          </ShapeContainer>
          <FrontPanel
            onWheel={onWheel}
            onTouchStart={onTouchZoomStart}
            onTouchMove={onTouchZoomMove}
          />
        </TransformContainer>
      </Viewer>
    </Container>
  )
}
