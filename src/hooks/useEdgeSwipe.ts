import { useEffect, useRef } from 'react'

interface TouchTrack {
  x0: number
  y0: number
  edge: 'left' | 'right' | null
  tracking: boolean
}

export interface UseEdgeSwipeOptions {
  enabled?: boolean
  /** Ancho de zona sensible en px desde cada borde */
  edgeWidth?: number
  /** Desplazamiento mínimo horizontal para contar el gesto */
  minDistance?: number
  /** Dedo hacia la izquierda (desde borde derecho) */
  onSwipeLeft?: () => void
  /** Dedo hacia la derecha (desde borde izquierdo) */
  onSwipeRight?: () => void
  /** Ignorar gestos que empiecen dentro de este selector */
  excludeSelector?: string
}

export function useEdgeSwipe({
  enabled = true,
  edgeWidth = 28,
  minDistance = 72,
  onSwipeLeft,
  onSwipeRight,
  excludeSelector,
}: UseEdgeSwipeOptions): void {
  const touchRef = useRef<TouchTrack>({
    x0: 0,
    y0: 0,
    edge: null,
    tracking: false,
  })

  useEffect(() => {
    if (!enabled) return

    function isExcluded(target: EventTarget | null): boolean {
      if (!excludeSelector || !(target instanceof Element)) return false
      return Boolean(target.closest(excludeSelector))
    }

    function onTouchStart(e: TouchEvent) {
      if (isExcluded(e.target)) return
      const touch = e.touches[0]
      if (!touch) return

      const x = touch.clientX
      const width = window.innerWidth
      let edge: 'left' | 'right' | null = null
      if (x <= edgeWidth) edge = 'left'
      else if (x >= width - edgeWidth) edge = 'right'
      else return

      touchRef.current = {
        x0: x,
        y0: touch.clientY,
        edge,
        tracking: true,
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!touchRef.current.tracking) return
      const touch = e.touches[0]
      if (!touch) return

      const dx = touch.clientX - touchRef.current.x0
      const dy = touch.clientY - touchRef.current.y0
      if (Math.abs(dy) > Math.abs(dx) * 1.25) {
        touchRef.current.tracking = false
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touchRef.current.tracking) return
      const touch = e.changedTouches[0]
      const track = touchRef.current
      touchRef.current.tracking = false
      if (!touch) return

      const dx = touch.clientX - track.x0
      const dy = touch.clientY - track.y0
      if (Math.abs(dy) > Math.abs(dx)) return
      if (Math.abs(dx) < minDistance) return

      if (track.edge === 'right' && dx < 0) onSwipeLeft?.()
      if (track.edge === 'left' && dx > 0) onSwipeRight?.()
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [
    enabled,
    edgeWidth,
    minDistance,
    onSwipeLeft,
    onSwipeRight,
    excludeSelector,
  ])
}

export interface UseHorizontalDismissOptions {
  enabled?: boolean
  /** Cerrar al deslizar hacia la izquierda */
  dismissOnSwipeLeft?: boolean
  /** Cerrar al deslizar hacia la derecha */
  dismissOnSwipeRight?: boolean
  minDistance?: number
  onDismiss: () => void
}

/** Swipe horizontal en cualquier parte del panel (para cerrar overlays) */
export function useHorizontalDismiss({
  enabled = true,
  dismissOnSwipeLeft = false,
  dismissOnSwipeRight = false,
  minDistance = 72,
  onDismiss,
}: UseHorizontalDismissOptions): void {
  const touchRef = useRef({ x0: 0, y0: 0, tracking: false })

  useEffect(() => {
    if (!enabled) return

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0]
      if (!touch) return
      touchRef.current = {
        x0: touch.clientX,
        y0: touch.clientY,
        tracking: true,
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!touchRef.current.tracking) return
      const touch = e.touches[0]
      if (!touch) return
      const dx = touch.clientX - touchRef.current.x0
      const dy = touch.clientY - touchRef.current.y0
      if (Math.abs(dy) > Math.abs(dx) * 1.25) {
        touchRef.current.tracking = false
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touchRef.current.tracking) return
      const touch = e.changedTouches[0]
      touchRef.current.tracking = false
      if (!touch) return

      const dx = touch.clientX - touchRef.current.x0
      const dy = touch.clientY - touchRef.current.y0
      if (Math.abs(dy) > Math.abs(dx)) return
      if (Math.abs(dx) < minDistance) return

      if (dismissOnSwipeLeft && dx < 0) onDismiss()
      if (dismissOnSwipeRight && dx > 0) onDismiss()
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [
    enabled,
    dismissOnSwipeLeft,
    dismissOnSwipeRight,
    minDistance,
    onDismiss,
  ])
}
