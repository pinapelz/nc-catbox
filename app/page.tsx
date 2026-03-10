import { FileUploader } from "@/components/file-uploader"
import { ThemeToggle } from "@/components/theme-toggle"
import { MascotRotator } from "@/components/mascot-rotator"
import { Package } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center px-4 py-12">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <h1 className="text-5xl font-bold text-foreground tracking-tight">
            MoeBox
          </h1>
          <Package className="w-12 h-12 text-primary" strokeWidth={1.5} />
        </div>

        {/* Info Text */}
        <p className="text-lg text-foreground mb-8 text-center">
          Upload files and get shareable links. Enter the{" "}
          <span className="font-semibold">secret code</span> to upload.
        </p>

        {/* Uploader */}
        <FileUploader />

        {/* Footer Links */}
        <nav className="mt-8 flex flex-wrap justify-center gap-x-1 text-sm">
          <a
            href="https://github.com/pinapelz/nc-catbox"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline cursor-pointer"
          >
            Source
          </a>
          <span className="text-muted-foreground">|</span>
          <ThemeToggle />
        </nav>
      </div>

      {/* Mascot */}
      <MascotRotator />
    </main>
  )
}
