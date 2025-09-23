'use client'

import type { PropsWithChildren } from 'react'
import { useAnimatedCounter } from '../hooks/useAnimatedCounter'
import { useInView } from '../hooks/useInView'

interface AnimatedCounterProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  children = null,
}: PropsWithChildren<AnimatedCounterProps>) {
  const [ref, isInView] = useInView(0.3)
  const count = useAnimatedCounter(value, duration, isInView)

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  return (
    <div ref={ref} className="text-center">
      <div className="font-mono text-3xl lg:text-4xl font-bold text-primary mb-2">
        {prefix}
        {formatNumber(count)}
        {suffix}
      </div>
      <div className="font-serif text-sm lg:text-md text-base-content font-bold">
        {children}
      </div>
    </div>
  )
}
