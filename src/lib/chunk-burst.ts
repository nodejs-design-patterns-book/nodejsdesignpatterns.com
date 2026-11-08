/**
 * A one-shot burst of stream "chunks" (rounded bars) to celebrate a
 * successful free-chapter signup. It draws on a temporary canvas laid over
 * `container`, runs for about a second and a half, then removes itself.
 *
 * Skipped entirely when the visitor prefers reduced motion.
 */

// Same family as the StreamRibbon: brand green, cover blue/violet, amber, white
const COLORS = [
  '#34c46a',
  '#8ff0b3',
  '#4f6df5',
  '#9b5de5',
  '#f5a524',
  '#ffffff',
]

interface Chunk {
  x: number
  y: number
  vx: number
  vy: number
  length: number
  thickness: number
  angle: number
  spin: number
  color: string
  life: number
}

const GRAVITY = 1500 // px/s²
const DRAG = 0.986 // velocity kept per 60fps frame

export function chunkBurst(
  origin: DOMRect,
  container: HTMLElement,
  count = 90,
): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const bounds = container.getBoundingClientRect()
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '30',
  })
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(bounds.width * ratio)
  canvas.height = Math.round(bounds.height * ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(ratio, ratio)
  container.appendChild(canvas)

  // Burst from the button, in the container's coordinate space
  const ox = origin.left + origin.width / 2 - bounds.left
  const oy = origin.top + origin.height / 2 - bounds.top

  const chunks: Chunk[] = Array.from({ length: count }, () => {
    // Mostly upward, fanning out to both sides
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95
    const speed = 420 + Math.random() * 560
    return {
      x: ox + (Math.random() - 0.5) * origin.width * 0.7,
      y: oy + (Math.random() - 0.5) * origin.height * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: 6 + Math.random() * 16,
      thickness: 4 + Math.random() * 2,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1.1 + Math.random() * 0.7,
    }
  })

  let last = performance.now()
  let age = 0

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30)
    last = now
    age += dt
    ctx.clearRect(0, 0, bounds.width, bounds.height)

    let alive = 0
    const drag = Math.pow(DRAG, dt * 60)
    for (const c of chunks) {
      if (age > c.life) continue
      alive++
      c.vx *= drag
      c.vy = c.vy * drag + GRAVITY * dt
      c.x += c.vx * dt
      c.y += c.vy * dt
      c.angle += c.spin * dt

      // Fade out over the last 40% of each chunk's life
      ctx.globalAlpha = Math.min(1, (c.life - age) / (c.life * 0.4))
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.rotate(c.angle)
      ctx.fillStyle = c.color
      ctx.beginPath()
      if (ctx.roundRect) {
        ctx.roundRect(
          -c.length / 2,
          -c.thickness / 2,
          c.length,
          c.thickness,
          c.thickness / 2,
        )
      } else {
        ctx.rect(-c.length / 2, -c.thickness / 2, c.length, c.thickness)
      }
      ctx.fill()
      ctx.restore()
    }

    if (alive > 0) requestAnimationFrame(frame)
    else canvas.remove()
  }

  requestAnimationFrame(frame)
}
