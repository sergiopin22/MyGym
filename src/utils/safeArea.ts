/** Insets reales para iPhone PWA (env() suele devolver 0 en standalone). */
export function initSafeAreaInsets(): () => void {
  const root = document.documentElement

  function isIosStandalone(): boolean {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error legacy iOS
      window.navigator.standalone === true
    return ios && standalone
  }

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

  /** Valores típicos cuando env() falla en PWA instalada */
  function iosStandaloneFallback(): { top: number; bottom: number } {
    if (!isIosStandalone()) return { top: 0, bottom: 0 }

    const h = window.screen.height
    const w = window.screen.width
    const long = Math.max(h, w)
    const short = Math.min(h, w)

    if (long < 812) return { top: 20, bottom: 0 }

    const bottom = 34
    // Dynamic Island / iPhone 14 Pro+
    const top = short >= 393 && long >= 852 ? 59 : 47
    return { top, bottom }
  }

  function update() {
    const envTop = readEnvInset('top')
    const envBottom = readEnvInset('bottom')
    const fallback = iosStandaloneFallback()
    const vv = window.visualViewport

    const topGap = vv ? Math.max(0, vv.offsetTop) : 0
    const bottomGap = vv
      ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      : 0

    const sat = Math.max(envTop, fallback.top, topGap)
    const sab = Math.max(envBottom, fallback.bottom, bottomGap)

    root.style.setProperty('--sat', `${sat}px`)
    root.style.setProperty('--sab', `${sab}px`)
    root.style.setProperty('--bottom-nav-total', `${sab}px`)

    if (isIosStandalone()) {
      root.dataset.pwaStandalone = 'true'
    } else {
      delete root.dataset.pwaStandalone
    }
  }

  update()
  window.addEventListener('resize', update)
  window.addEventListener('orientationchange', update)
  window.addEventListener('load', update)
  window.visualViewport?.addEventListener('resize', update)
  window.visualViewport?.addEventListener('scroll', update)

  return () => {
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', update)
    window.removeEventListener('load', update)
    window.visualViewport?.removeEventListener('resize', update)
    window.visualViewport?.removeEventListener('scroll', update)
  }
}
