"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = saved === "dark" || (!saved && prefersDark)
    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle("dark", shouldBeDark)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    localStorage.setItem("theme", newIsDark ? "dark" : "light")
    document.documentElement.classList.toggle("dark", newIsDark)
  }

  if (!mounted) {
    return <div className="w-[70px]" />
  }

  return (
    <button
      onClick={toggleTheme}
      className="text-primary hover:underline text-sm flex items-center gap-1"
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5" />
          Go Light
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5" />
          Go Dark
        </>
      )}
    </button>
  )
}
