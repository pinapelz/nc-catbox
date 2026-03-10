"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { X, Copy, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface UploadResult {
  success: boolean
  url?: string
  filename?: string
  originalName?: string
  size?: number
  error?: string
}

interface UploadedFile {
  name: string
  size: number
  url: string
}

const SECRET_STORAGE_KEY = "moebox-secret"

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [secret, setSecret] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load secret from localStorage on mount
  useEffect(() => {
    const savedSecret = localStorage.getItem(SECRET_STORAGE_KEY)
    if (savedSecret) {
      setSecret(savedSecret)
    }
  }, [])

  // Save secret to localStorage when it changes (after successful upload)
  const saveSecret = (secretToSave: string) => {
    if (secretToSave) {
      localStorage.setItem(SECRET_STORAGE_KEY, secretToSave)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("secret", secret)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const result: UploadResult = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Upload failed")
    }

    return result
  }

  const handleFiles = async (files: FileList | File[]) => {
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    const fileArray = Array.from(files)
    const totalFiles = fileArray.length
    let completed = 0
    let hasSuccessfulUpload = false

    try {
      for (const file of fileArray) {
        const result = await uploadFile(file)
        if (result.success && result.url) {
          hasSuccessfulUpload = true
          setUploadedFiles((prev) => [
            { name: result.originalName || file.name, size: file.size, url: result.url! },
            ...prev,
          ])
        }
        completed++
        setUploadProgress(Math.round((completed / totalFiles) * 100))
      }
      
      // Save secret after successful upload
      if (hasSuccessfulUpload) {
        saveSecret(secret)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [secret]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const copyToClipboard = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const removeFile = (url: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.url !== url))
  }

  const clearSecret = () => {
    setSecret("")
    localStorage.removeItem(SECRET_STORAGE_KEY)
  }

  return (
    <div className="w-full max-w-xl space-y-4">
      {/* Secret Input */}
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder="Secret code"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="bg-card border-border text-foreground placeholder:text-muted-foreground h-10"
        />
        {secret && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSecret}
            className="text-muted-foreground hover:text-foreground h-10 px-3"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Upload Zone - catbox style */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex items-center justify-center py-16 px-8 bg-card border-2 cursor-pointer transition-all",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-primary hover:bg-primary/5",
          isUploading && "pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-lg text-primary">
              Uploading... {uploadProgress}%
            </span>
          </div>
        ) : (
          <span className="text-xl text-primary">
            Select or drop files
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.url}
              className="flex items-center gap-2 p-3 bg-card border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground truncate">
                    {file.name}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <div className="mt-1 text-sm text-primary truncate">
                  {file.url}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(file.url)}
                className="shrink-0 text-primary hover:text-primary hover:bg-primary/10"
              >
                {copiedUrl === file.url ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFile(file.url)}
                className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
