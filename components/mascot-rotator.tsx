"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const MASCOT_IMAGES = [
  "/mascots/mythra.webp",
  "/mascots/kirijo.webp",
  "/mascots/hiruko.webp",
]

export function MascotRotator() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentIndex(Math.floor(Math.random() * MASCOT_IMAGES.length))
  }, [])

  const handleClick = () => {
    setCurrentIndex((prev) => (prev + 1) % MASCOT_IMAGES.length)
  }

  if (!mounted) return null

  return (
    <div
      className="fixed bottom-0 right-0 cursor-pointer select-none z-10 opacity-90 transition-opacity"
      onClick={handleClick}
      title="Click to change mascot"
    >
      <Image
        src={MASCOT_IMAGES[currentIndex]}
        alt="Mascot"
        width={200}
        height={280}
        className="object-contain pointer-events-none"
        priority
      />
    </div>
  )
}
