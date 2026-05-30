'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** Triggered when the user holds for >= duration ms */
  onConfirm: () => void
  /** ms required to confirm */
  duration?: number
  disabled?: boolean
  className?: string
  fillClassName?: string
  children: ReactNode
}

/**
 * Hold-to-confirm: a clip-path fill sweeps left → right while pressed.
 * Release early cancels and snaps back. Adapted from Emil's clip-path patterns.
 */
export function HoldButton({
  onConfirm,
  duration = 700,
  disabled,
  className,
  fillClassName,
  children,
}: Props) {
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const timeoutsRef = useRef<Set<number>>(new Set())
  const fillRef = useRef<HTMLDivElement | null>(null)
  const [releasing, setReleasing] = useState(false)
  const confirmedRef = useRef(false)

  // clip-path inset eats from the right; shrinking it reveals the fill L→R.
  const insetFor = (p: number) => `inset(0 ${(1 - p) * 100}% 0 0 round 12px)`

  // Wrapper that remembers timeouts so we can clear them on unmount.
  function later(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      timeoutsRef.current.delete(id)
      fn()
    }, ms)
    timeoutsRef.current.add(id)
  }

  // Cancel any in-flight animation frame / timers if we unmount mid-hold.
  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      timeouts.forEach((id) => window.clearTimeout(id))
      timeouts.clear()
    }
  }, [])

  function tick(now: number) {
    if (startRef.current === null) return
    const elapsed = now - startRef.current
    const p = Math.min(1, elapsed / duration)
    // Drive the fill imperatively — no per-frame React re-render.
    if (fillRef.current) fillRef.current.style.clipPath = insetFor(p)
    if (p >= 1) {
      if (!confirmedRef.current) {
        confirmedRef.current = true
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12)
        } catch {}
        onConfirm()
        // hold full state briefly then drop
        later(() => {
          setReleasing(true)
          if (fillRef.current) fillRef.current.style.clipPath = insetFor(0)
          later(() => {
            setReleasing(false)
            confirmedRef.current = false
          }, 200)
        }, 180)
      }
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function start(e: React.PointerEvent) {
    if (disabled || confirmedRef.current) return
    // Capture the pointer so the hold keeps tracking even if the finger drifts.
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    startRef.current = performance.now()
    setReleasing(false)
    rafRef.current = requestAnimationFrame(tick)
  }

  function cancel() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    startRef.current = null
    if (confirmedRef.current) return
    setReleasing(true)
    if (fillRef.current) fillRef.current.style.clipPath = insetFor(0)
    later(() => setReleasing(false), 200)
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      className={cn(
        'press relative overflow-hidden rounded-xl',
        disabled && 'opacity-50',
        className
      )}
    >
      <div
        ref={fillRef}
        className={cn(
          'pointer-events-none absolute inset-0',
          fillClassName ?? 'bg-emerald-500'
        )}
        style={{
          clipPath: insetFor(0),
          transition: releasing ? 'clip-path 200ms cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  )
}
