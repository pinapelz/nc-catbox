import { NextRequest, NextResponse } from "next/server"

const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD
const UPLOAD_SECRET = process.env.UPLOAD_SECRET
const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || "uploads"

function generateRandomFilename(originalName: string): string {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : ""
  const randomString = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  return ext ? `${randomString}.${ext}` : randomString
}

async function uploadToWebDAV(file: File, filename: string): Promise<boolean> {
  const webdavUrl = `${NEXTCLOUD_URL}/remote.php/dav/files/${NEXTCLOUD_USERNAME}/${UPLOAD_FOLDER}/${filename}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const response = await fetch(webdavUrl, {
    method: "PUT",
    headers: {
      Authorization: "Basic " + Buffer.from(`${NEXTCLOUD_USERNAME}:${NEXTCLOUD_PASSWORD}`).toString("base64"),
      "Content-Type": file.type || "application/octet-stream",
    },
    body: buffer,
  })

  return response.ok || response.status === 201 || response.status === 204
}

async function createShareLink(filename: string): Promise<string | null> {
  const apiUrl = `${NEXTCLOUD_URL}/ocs/v2.php/apps/files_sharing/api/v1/shares`

  const formData = new URLSearchParams()
  formData.append("path", `/${UPLOAD_FOLDER}/${filename}`)
  formData.append("shareType", "3") // 3 = public link
  formData.append("permissions", "1") // 1 = read-only

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${NEXTCLOUD_USERNAME}:${NEXTCLOUD_PASSWORD}`).toString("base64"),
      "OCS-APIRequest": "true",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    console.error("Share creation failed:", response.status, await response.text())
    return null
  }

  const text = await response.text()

  const urlMatch = text.match(/<url>([^<]+)<\/url>/)
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1]
  }

  return null
}

export async function POST(request: NextRequest) {
  if (!NEXTCLOUD_URL || !NEXTCLOUD_USERNAME || !NEXTCLOUD_PASSWORD) {
    return NextResponse.json(
      { error: "Server not configured. Missing Nextcloud credentials." },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const secret = formData.get("secret") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (UPLOAD_SECRET && secret !== UPLOAD_SECRET) {
      return NextResponse.json({ error: "Invalid secret code" }, { status: 401 })
    }

    const filename = generateRandomFilename(file.name)

    const uploaded = await uploadToWebDAV(file, filename)
    if (!uploaded) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    const shareLink = await createShareLink(filename)
    if (!shareLink) {
      return NextResponse.json(
        { error: "File uploaded but failed to create share link" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: shareLink,
      filename: filename,
      originalName: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
