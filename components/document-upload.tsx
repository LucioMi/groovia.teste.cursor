"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"

interface DocumentUploadProps {
  category: string
  organizationId?: string
  onUploadComplete?: () => void
}

export function DocumentUpload({ category, organizationId, onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0])
    }
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", category)
      if (organizationId) {
        formData.append("organizationId", organizationId)
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        onUploadComplete?.()
      } else {
        console.error("Upload failed")
      }
    } catch (error) {
      console.error("[v0] Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card
      className={`border-2 border-dashed p-8 text-center transition-colors ${
        dragActive ? "border-purple-500 bg-purple-50" : "border-gray-300"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id={`file-upload-${category}`}
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      <label htmlFor={`file-upload-${category}`} className="cursor-pointer">
        <div className="flex flex-col items-center gap-2">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600">
            {uploading ? "Enviando..." : "Arraste arquivos ou clique para selecionar"}
          </p>
          <p className="text-xs text-gray-500">PDF, Excel, Word, imagens</p>
        </div>
      </label>
    </Card>
  )
}
