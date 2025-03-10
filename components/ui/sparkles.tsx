"use client"
import { useEffect, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import type { Container, ISourceOptions } from "@tsparticles/engine"
import { loadSlim } from "@tsparticles/slim"
import { cn } from "@/lib/utils"

type ParticlesProps = {
  id?: string
  className?: string
  background?: string
  particleSize?: number
  minSize?: number
  maxSize?: number
  speed?: number
  particleColor?: string
  particleDensity?: number
}

export const SparklesCore = (props: ParticlesProps) => {
  const {
    id = "tsparticles",
    className,
    background,
    minSize = 0.6,
    maxSize = 1.4,
    speed = 1,
    particleColor = "#FFFFFF",
    particleDensity = 100,
  } = props
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])

  const particlesLoaded = async (container?: Container): Promise<void> => {
    if (container) {
      console.log("Particles loaded")
    }
  }

  const options: ISourceOptions = {
    background: {
      color: {
        value: background || "transparent",
      },
    },
    fullScreen: {
      enable: false,
      zIndex: 1,
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: {
          enable: false,
          mode: "push",
        },
        onHover: {
          enable: false,
          mode: "repulse",
        },
      },
      modes: {
        push: {
          quantity: 4,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
        },
      },
    },
    particles: {
      bounce: {
        horizontal: {
          value: 1,
        },
        vertical: {
          value: 1,
        },
      },
      collisions: {
        enable: false,
      },
      color: {
        value: particleColor,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: {
          default: "out",
        },
        random: false,
        speed: speed,
        straight: false,
      },
      number: {
        // Use a simpler configuration for number
        value: particleDensity,
        // Remove the density property that's causing issues
      },
      opacity: {
        animation: {
          enable: true,
          speed: 0.05,
          sync: true,
          startValue: "max",
          count: 1,
          destroy: "min",
        },
        value: {
          min: 0,
          max: 0.5,
        },
      },
      shape: {
        type: "circle",
      },
      size: {
        value: {
          min: minSize,
          max: maxSize,
        },
      },
    },
    detectRetina: true,
  }

  if (init) {
    return (
      <Particles
        id={id}
        className={cn("h-full w-full", className)}
        particlesLoaded={particlesLoaded}
        options={options}
      />
    )
  }

  return <></>
}

