import { useEffect, useState } from 'react'

export function useAnimatedCounter(
  targetValue: number,
  duration = 2000,
  trigger = false,
) {
  const [currentValue, setCurrentValue] = useState(0)

  useEffect(() => {
    if (!trigger) return

    let startValue = 0
    const increment = targetValue / (duration / 16) // 60fps

    const timer = setInterval(() => {
      startValue += increment
      if (startValue >= targetValue) {
        setCurrentValue(targetValue)
        clearInterval(timer)
      } else {
        setCurrentValue(Math.floor(startValue))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [targetValue, duration, trigger])

  return currentValue
}
