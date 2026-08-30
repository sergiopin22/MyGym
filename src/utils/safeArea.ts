/** Insets reales para iPhone PWA (env() a veces devuelve 0 en standalone). */
export function initSafeAreaInsets(): () => void {
  const root = document.documentElement

  function readEnvInset(side: 'top' | 'bottom'): number {
    const probe = document.createElement('div')
    const pad =
      side === 'top'
        ? 'padding-top:constant(safe-area-inset-top);padding-top:env(safe-area-inset-top);'
        : 'padding-bottom:constant(safe-area-inset-bottom);padding-bottom:env(safe-area-inset-bottom);'
    probe.style.cssText = `position:fixed;top:0;left:0;${pad}visibility:hidden;pointer-events:none;`
    document.body.appendChild(probe)
    const value =
      side === 'top'
        ? parseFloat(getComputedStyle(probe).paddingTop) || 0
        : parseFloat(getComputedStyle(probe).paddingBottom) || 0
    probe.remove()
    return value
  }

  function iosHomeIndicatorFallback(): number {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!standalone || !ios) return 0
    const longSide = Math.max(window.screen.height, window.screen.width)
    if (longSide >= 812) return 34
    return 0
  }

  function viewportBottomGap(): number {
    const vv = window.visualViewport
    if (!vv) return 0
    return Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
  }

  function update() {
    const envBottom = readEnvInset('bottom')
    const envTop = readEnvInset('top')
    const fallback = iosHomeIndicatorFallback()
    const sab = Math.max(envBottom, fallback)
    const gap = viewportBottomGap()

    root.style.setProperty('--sab', `${sab}px`)
    root.style.setProperty('--sat', `${envTop}px`)
    root.style.setProperty('--app-bottom-gap', `${gap}px`)
    root.style.setProperty('--bottom-nav-total', `${sab + gap}px`)
  }

  update()
  window.addEventListener('resize', update)
  window.addEventListener('orientationchange', update)
  window.visualViewport?.addEventListener('resize', update)
  window.visualViewport?.addEventListener('scroll', update)

  return () => {
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', update)
    window.visualViewport?.removeEventListener('resize', update)
    window.visualViewport?.removeEventListener('scroll', update)
  }
}
