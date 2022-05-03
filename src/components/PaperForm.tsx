import React, { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  position: relative;
  height: 100%;
  background: #555;
  overflow: hidden;
  user-select: none;
`

const Viewer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

const TransformContainer = styled.div`
  transform-origin: left top;
  box-shadow: 0 0 8px 8px #2227;
  background: #fff;
`

const ShapeContainer = styled.div<{ src: string; scale: number; naturalSize: { width: number; height: number } }>`
  position: relative;
  width: ${props => props.naturalSize.width}px;
  height: ${props => props.naturalSize.height}px;
  background: center/contain no-repeat url(${props => props.src});
  transform-origin: left top;
  transform: scale(${(props) => props.scale});
`

const CtrlPanel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: move;
`

const ZOOM_MAX = 3
const calcDistance = (touches: TouchList | React.TouchList) =>
  ((touches[0].pageX - touches[1].pageX) ** 2 + (touches[0].pageY - touches[1].pageY) ** 2) ** 0.5

export const PaperForm = (props: { src: string; untouchable?: ReactElement }) => {
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 })
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [viewerWidth, setViewerWidth] = useState(0)
  const aspect = useMemo(() => naturalSize.width/ naturalSize.height,  [naturalSize])
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
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setPrevPanPoint({ x: e.touches[0].pageX, y: e.touches[0].pageY })
    } else if (e.touches.length === 2) {
      setPrevPanPoint(null)
      setBaseDistance(calcDistance(e.touches) / scale)
    }
  }
  const onTouchmove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      onMouseMove(e.touches[0])
    } else if (e.touches.length === 2) {
      onZoom(
        (e.touches[0].clientX + e.touches[1].clientX) / 2 ,
        (e.touches[0].clientY + e.touches[1].clientY) / 2 ,
        calcDistance(e.touches) / baseDistance - scale
      )
    }
  }
  const onWheel = (e: React.WheelEvent) => {
    onZoom(e.nativeEvent.offsetX, e.nativeEvent.offsetY, e.deltaY < 0 ? 0.2 : -0.2)
  }

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
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
    <Container ref={containerRef} onMouseMove={onMouseMove}>
      <Viewer style={{ width: `${viewerWidth}px`, height: `${viewerHeight}px` }}>
        <TransformContainer
          style={{
            width: `${viewerWidth}px`,
            height: `${viewerHeight}px`,
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
        >
          <ShapeContainer src={props.src} scale={viewerWidth / naturalSize.width} naturalSize={naturalSize}>
            {props.untouchable}
          </ShapeContainer>
          <CtrlPanel
            ref={panelRef}
            onMouseDown={onMouseDown}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchmove}
          />
        </TransformContainer>
      </Viewer>
    </Container>
  )
}
