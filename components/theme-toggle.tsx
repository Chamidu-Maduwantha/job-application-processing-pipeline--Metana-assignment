"use client"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full backdrop-blur-md bg-background/50 border-background/20 shadow-lg"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 45 : 0, opacity: theme === "dark" ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="absolute"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ rotate: theme === "light" ? -45 : 0, opacity: theme === "light" ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="absolute"
      >
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      </motion.div>
    </Button>
  )
}

