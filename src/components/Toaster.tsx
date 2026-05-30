'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Check, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'default' | 'success' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  action?: ToastAction
  duration: number
}

type Listener = (toast: ToastItem) => void

const listeners = new Set<Listener>()

function emit(toast: Omit<ToastItem, 'id'>) {
  const item: ToastItem = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...toast,
  }
  listeners.forEach((l) => l(item))
}

export const toast = {
  success(message: string, opts?: { action?: ToastAction; duration?: number }) {
    emit({ message, variant: 'success', action: opts?.action, duration: opts?.duration ?? 3500 })
  },
  error(message: string, opts?: { action?: ToastAction; duration?: number }) {
    emit({ message, variant: 'error', action: opts?.action, duration: opts?.duration ?? 4500 })
  },
  message(message: string, opts?: { action?: ToastAction; duration?: number }) {
    emit({ message, variant: 'default', action: opts?.action, duration: opts?.duration ?? 3500 })
  },
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, { remaining: number; startedAt: number; timeoutId: number }>>(
    new Map()
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const entry = timers.current.get(id)
    if (entry) {
      window.clearTimeout(entry.timeoutId)
      timers.current.delete(id)
    }
  }, [])

  const schedule = useCallback(
    (id: string, ms: number) => {
      const timeoutId = window.setTimeout(() => dismiss(id), ms)
      timers.current.set(id, { remaining: ms, startedAt: Date.now(), timeoutId })
    },
    [dismiss]
  )

  useEffect(() => {
    const listener: Listener = (t) => {
      setToasts((prev) => {
        // Keep at most 3 toasts; clear timers for any we drop so they don't
        // fire a stray dismiss after they've already left the screen.
        const next = [...prev, t]
        const dropped = next.slice(0, Math.max(0, next.length - 3))
        dropped.forEach((d) => {
          const entry = timers.current.get(d.id)
          if (entry) {
            window.clearTimeout(entry.timeoutId)
            timers.current.delete(d.id)
          }
        })
        return next.slice(-3)
      })
      schedule(t.id, t.duration)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [schedule])

  // Clear every pending timer when the Toaster unmounts.
  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((entry) => window.clearTimeout(entry.timeoutId))
      map.clear()
    }
  }, [])

  // Pause timers when tab is hidden — Sonner principle
  useEffect(() => {
    function onVis() {
      if (document.hidden) {
        timers.current.forEach((entry, id) => {
          window.clearTimeout(entry.timeoutId)
          entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.startedAt))
          timers.current.set(id, entry)
        })
      } else {
        timers.current.forEach((entry, id) => {
          schedule(id, entry.remaining)
        })
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [schedule])

  // The live region stays mounted even when empty so screen readers reliably
  // announce toasts as they're inserted (a region added alongside its content
  // is often missed). It's pointer-events-none, so it never blocks taps.
  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {toasts.map((t) => (
        <ToastView key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastView({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function close() {
    setLeaving(true)
    window.setTimeout(onDismiss, 220)
  }

  const Icon = toast.variant === 'success' ? Check : toast.variant === 'error' ? AlertCircle : null

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg backdrop-blur-md',
        'transition-[opacity,transform] duration-[260ms]',
        // Motion-sensitive users get the fade only — no slide/scale.
        'motion-reduce:translate-y-0 motion-reduce:scale-100',
        toast.variant === 'success' && 'border-emerald-200/60 dark:border-emerald-900/40',
        toast.variant === 'error' && 'border-destructive/40',
        mounted && !leaving ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-3 opacity-0 scale-[0.96]'
      )}
      style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
    >
      {Icon && (
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full',
            toast.variant === 'success' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
            toast.variant === 'error' && 'bg-destructive/15 text-destructive'
          )}
        >
          <Icon size={14} strokeWidth={2.5} />
        </span>
      )}
      <span className="flex-1 truncate">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick()
            close()
          }}
          className="press shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-secondary"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={close}
        className="press shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
