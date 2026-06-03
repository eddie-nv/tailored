import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  const savedFocus = useRef<Element | null>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    savedFocus.current = document.activeElement

    const focusable = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    focusable[0]?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !containerRef.current) return
      const els = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!els.length) return
      const first = els[0]!
      const last = els[els.length - 1]!
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (savedFocus.current instanceof HTMLElement) {
        savedFocus.current.focus()
      }
    }
  }, [active, containerRef])
}
