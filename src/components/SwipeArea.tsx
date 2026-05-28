'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  /** Minimum px distance to count as a swipe (falls back to velocity check) */
  threshold?: number
  /** Velocity in px/ms beyond which a flick counts regardless of distance */
  velocityThreshold?: number
  className?: string
}

export function SwipeArea({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  velocityThreshold = 0.35,
  className,
}: Props) {
  const startX = useRef(0)
  const startTime = useRef(0)
  const pointerIdRef = useRef<number | null>(null)
  const [dx, setDx] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'dragging' | 'resolving'>('idle')

  function onPointerDown(e: React.PointerEvent) {
    if (pointerIdRef.current !== null) return
    pointerIdRef.current = e.pointerId
    startX.current = e.clientX
    startTime.current = Date.now()
    setPhase('dragging')
  }

  function onPointerMove(e: React.PointerEvent) {
    if (phase !== 'dragging' || pointerIdRef.current !== e.pointerId) return
    const raw = e.clientX - startX.current
    const dampedLeft = !onSwipeLeft && raw < 0
    const dampedRight = !onSwipeRight && raw > 0
    const next = dampedLeft || dampedRight ? raw * 0.25 : raw
    setDx(next)
  }

  function release(e: React.PointerEvent) {
    if (phase !== 'dragging' || pointerIdRef.current !== e.pointerId) return
    const distance = e.clientX - startX.current
    const elapsed = Math.max(1, Date.now() - startTime.current)
    const velocity = Math.abs(distance) / elapsed
    const flicked = velocity > velocityThreshold && Math.abs(distance) > 16
    const traveled = Math.abs(distance) > threshold

    pointerIdRef.current = null

    if ((flicked || traveled) && distance < 0 && onSwipeLeft) {
      setPhase('resolving')
      setDx(-window.innerWidth * 0.4)
      window.setTimeout(() => {
        onSwipeLeft()
        setDx(0)
        setPhase('idle')
      }, 160)
    } else if ((flicked || traveled) && distance > 0 && onSwipeRight) {
      setPhase('resolving')
      setDx(window.innerWidth * 0.4)
      window.setTimeout(() => {
        onSwipeRight()
        setDx(0)
        setPhase('idle')
      }, 160)
    } else {
      setPhase('idle')
      setDx(0)
    }
  }

  const transition =
    phase === 'dragging' ? 'none' : 'transform 260ms cubic-bezier(0.23, 1, 0.32, 1)'

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      style={{
        transform: `translate3d(${dx}px, 0, 0)`,
        transition,
        touchAction: 'pan-y',
      }}
      className={cn('select-none', className)}
    >
      {children}
    </div>
  )
}
