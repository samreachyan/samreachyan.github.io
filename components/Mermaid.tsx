'use client'

import { useEffect, useId, useRef, useState } from 'react'

type MermaidProps = {
  chart: string
}

type PanZoomInstance = {
  dispose: () => void
  zoomTo: (clientX: number, clientY: number, scaleMultiplier: number) => void
  zoomAbs: (clientX: number, clientY: number, zoomLevel: number) => void
  moveTo: (x: number, y: number) => void
  getTransform: () => { x: number; y: number; scale: number }
}

export default function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const panzoomRef = useRef<PanZoomInstance | null>(null)
  const id = useId().replace(/:/g, '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const render = async () => {
      if (!containerRef.current) return

      panzoomRef.current?.dispose?.()
      panzoomRef.current = null

      try {
        setError(null)
        containerRef.current.innerHTML = ''
        const mermaidModule = await import('mermaid')
        const mermaid =
          (mermaidModule as unknown as { default?: (typeof import('mermaid'))['default'] })
            .default ?? (mermaidModule as unknown as (typeof import('mermaid'))['default'])

        if (!mermaid || typeof mermaid.render !== 'function') {
          throw new Error('Mermaid library failed to load correctly.')
        }

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'default',
        })

        const { svg } = await mermaid.render(`mermaid-${id}`, chart)
        if (!isMounted || !containerRef.current) return

        containerRef.current.innerHTML = svg
        const svgElement = containerRef.current.querySelector('svg')
        if (!svgElement) return

        svgElement.style.maxWidth = '100%'
        svgElement.style.height = 'auto'

        try {
          const panzoomModule = await import('panzoom')
          const panzoomFactory =
            (
              panzoomModule as unknown as {
                default?: (el: SVGElement, opts: object) => PanZoomInstance
              }
            ).default ??
            (panzoomModule as unknown as (el: SVGElement, opts: object) => PanZoomInstance)

          panzoomRef.current = panzoomFactory(svgElement, {
            maxZoom: 8,
            minZoom: 0.4,
            smoothScroll: false,
            bounds: true,
            boundsPadding: 0.2,
            zoomDoubleClickSpeed: 1,
          })
        } catch {
          panzoomRef.current = null
        }
      } catch (err) {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(`Failed to render Mermaid diagram: ${message}`)
      }
    }

    render()

    return () => {
      isMounted = false
      panzoomRef.current?.dispose?.()
      panzoomRef.current = null
    }
  }, [chart, id])

  return (
    <div className="my-6 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <button
          type="button"
          className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          onClick={() => {
            const svg = containerRef.current?.querySelector('svg')
            if (svg && panzoomRef.current) {
              const rect = svg.getBoundingClientRect()
              const cx = rect.left + rect.width / 2
              const cy = rect.top + rect.height / 2
              panzoomRef.current.zoomTo(cx, cy, 1.25)
            }
          }}
        >
          +
        </button>
        <button
          type="button"
          className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          onClick={() => {
            const svg = containerRef.current?.querySelector('svg')
            if (svg && panzoomRef.current) {
              const rect = svg.getBoundingClientRect()
              const cx = rect.left + rect.width / 2
              const cy = rect.top + rect.height / 2
              panzoomRef.current.zoomTo(cx, cy, 0.8)
            }
          }}
        >
          -
        </button>
        <button
          type="button"
          className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          onClick={() => {
            if (panzoomRef.current) {
              panzoomRef.current.moveTo(0, 0)
              panzoomRef.current.zoomAbs(0, 0, 1)
            }
          }}
        >
          Reset
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Drag to move • Scroll to zoom
        </span>
      </div>

      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="mermaid-panzoom-wrapper overflow-hidden rounded border border-gray-100 p-2 dark:border-gray-800">
          <div ref={containerRef} className="cursor-grab active:cursor-grabbing" />
        </div>
      )}
    </div>
  )
}
