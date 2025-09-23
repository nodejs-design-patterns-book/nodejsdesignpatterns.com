'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { motion, useAnimation } from 'framer-motion'
import type React from 'react'
import { useEffect, useState } from 'react'
import { cn } from '../lib/utils'

const particleVariants = cva('absolute rounded-full opacity-30', {
  variants: {
    variant: {
      soft: 'absolute bg-accent/60 h-4 w-4 blur-xs',
      normal: 'absolute bg-accent/55 h-10 w-10 blur-sm',
      hard: 'absolute bg-accent/50 h-16 w-16 blur-md',
    },
  },
})

type ParticleProps = VariantProps<typeof particleVariants> & {
  className?: string
  scrollY: number
  left: string
  top: string
}

function Particle(props: ParticleProps & { style?: React.CSSProperties }) {
  const controls = useAnimation()
  let displacement: number
  switch (props.variant) {
    case 'soft':
      displacement = 0.3
      break
    case 'hard':
      displacement = 0.5
      break
    default:
      displacement = 0.4
      break
  }

  useEffect(() => {
    const float = async () => {
      while (true) {
        await controls.start({
          y: Math.random() * 20 - 40,
          x: Math.random() * 20 - 40,
          transition: { duration: 2, ease: 'easeInOut' },
        })
      }
    }
    float()
  }, [controls])

  return (
    <div
      style={{
        transform: `translateY(${props.scrollY * displacement}px)`,
        left: props.left,
        top: props.top,
        pointerEvents: 'none',
      }}
      className="relative h-16 w-16"
    >
      <motion.div
        animate={controls}
        className={cn(
          particleVariants({ variant: props.variant }),
          props.className,
        )}
      />
    </div>
  )
}

export function ParallaxBackground() {
  const [scrollY, setScrollY] = useState(0)
  const [particles, setParticles] = useState<ParticleProps[]>([])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)

    // Generate particles (client-side only)
    const variants = ['soft', 'normal', 'hard'] as const
    const grid = [0, 25, 50, 75, 100]
    const p = []
    for (const y of grid) {
      for (const x of grid) {
        const posX = x + Math.random() * 10 - 5
        const posY = y + Math.random() * 10 - 5
        p.push({
          variant: variants[Math.floor(Math.random() * variants.length)],
          left: `${posX}%`,
          top: `${posY}%`,
          scrollY: 0,
        })
      }
    }
    setParticles(p)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-base-100 to-accent/40" />

      {/* Floating elements */}
      {particles.map((props) => (
        <Particle
          key={`${props.left}_${props.top}_${props.variant}`}
          {...props}
          scrollY={scrollY}
        />
      ))}
    </div>
  )
}
