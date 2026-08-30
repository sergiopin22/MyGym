import { useEffect, useState } from 'react'
import {
  homeIndicatorHeight,
  measureSafeAreaInsets,
  subscribeSafeAreaInsets,
  type SafeAreaInsets,
} from '../utils/safeArea'

export function useSafeAreaInsets(): SafeAreaInsets & { homeIndicator: number } {
  const [insets, setInsets] = useState(measureSafeAreaInsets)

  useEffect(() => subscribeSafeAreaInsets(setInsets), [])

  return {
    ...insets,
    homeIndicator: homeIndicatorHeight(insets),
  }
}
