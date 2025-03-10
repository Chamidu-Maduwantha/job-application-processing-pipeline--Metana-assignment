"use client"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export const BackgroundBeams = ({
  className,
}: {
  className?: string
}) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })

  const beamsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!beamsRef.current) return

      const rect = beamsRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      setMousePosition({ x, y })
    }

    document.addEventListener("mousemove", handleMouseMove)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div ref={beamsRef} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(var(--color-primary),0.15)_10%,transparent_80%)]"
        style={
          {
            "--x": `${mousePosition.x}px`,
            "--y": `${mousePosition.y}px`,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

