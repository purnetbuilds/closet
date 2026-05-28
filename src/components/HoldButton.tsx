'use client'

import { useRef, useState, type ReactNode } from 'react'
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
  const [progress, setProgress] = useState(0) // 0..1
  const [releasing, setReleasing] = useState(false)
  const confirmedRef = useRef(false)

  function tick(now: number) {
    if (startRef.current === null) return
    const elapsed = now - startRef.current
    const p = Math.min(1, elapsed / duration)
    setProgress(p)
    if (p >= 1) {
      if (!confirmedRef.current) {
        confirmedRef.current = true
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12)
        } catch {}
        onConfirm()
        // hold full state briefly then drop
        window.setTimeout(() => {
          setReleasing(true)
          setProgress(0)
          window.setTimeout(() => {
            setReleasing(false)
            confirmedRef.current = false
          }, 200)
        }, 180)
      }
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function start() {
    if (disabled || confirmedRef.current) return
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
    setProgress(0)
    window.setTimeout(() => setReleasing(false), 200)
  }

  // clip-path inset eats from the right; we shrink it to reveal the fill left-to-right
  const inset = `inset(0 ${(1 - progress) * 100}% 0 0 round 12px)`

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
        className={cn(
          'pointer-events-none absolute inset-0',
          fillClassName ?? 'bg-emerald-500'
        )}
        style={{
          clipPath: inset,
          transition: releasing ? 'clip-path 200ms cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  )
}
