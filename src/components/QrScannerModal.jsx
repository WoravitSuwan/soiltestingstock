import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Camera, ImageUp } from 'lucide-react'
import Modal from './Modal'

// Frames are scaled down before decoding: full-HD phone frames are slow to scan and a
// QR code filling part of the view is still easily readable at this size.
const MAX_DECODE_SIZE = 720
const SCAN_INTERVAL_MS = 150

// Native detector (Android Chrome, some desktop browsers) also reads ordinary barcodes
// such as EAN-13 labels; everywhere else (e.g. iPhone Safari) jsQR reads QR codes.
const NATIVE_FORMATS = ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']

async function createNativeDetector() {
  try {
    if (!('BarcodeDetector' in window)) return null
    const supported = await window.BarcodeDetector.getSupportedFormats()
    const formats = NATIVE_FORMATS.filter((f) => supported.includes(f))
    return formats.length ? new window.BarcodeDetector({ formats }) : null
  } catch {
    return null
  }
}

function decodeWithJsQr(canvas, source, width, height) {
  if (!width || !height) return null
  const scale = Math.min(1, MAX_DECODE_SIZE / Math.max(width, height))
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(source, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  return jsQR(data, w, h, { inversionAttempts: 'attemptBoth' })?.data ?? null
}

async function decode(detector, canvas, source, width, height) {
  if (detector) {
    try {
      const found = await detector.detect(source)
      if (found[0]?.rawValue) return found[0].rawValue
    } catch {
      // fall through to jsQR
    }
  }
  return decodeWithJsQr(canvas, source, width, height)
}

// Opens the rear camera and reads a QR code (or barcode where supported). Calls
// onResult(text) once, then closes. When the camera can't be used (permission denied,
// in-app browser, no camera) a photo can be taken or picked instead.
export default function QrScannerModal({ open, onClose, onResult }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const photoRef = useRef(null)
  const galleryRef = useRef(null)
  const detectorRef = useRef(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  // latest callbacks without restarting the camera whenever the parent re-renders
  const callbacks = useRef({ onClose, onResult })
  callbacks.current = { onClose, onResult }

  useEffect(() => {
    if (!open) return
    setError('')
    setStarting(true)
    let stream = null
    let timer = 0
    let stopped = false

    function done(text) {
      stopped = true
      callbacks.current.onResult(text.trim())
      callbacks.current.onClose()
    }

    async function scan() {
      if (stopped) return
      const video = videoRef.current
      if (video && video.readyState >= 2) {
        const text = await decode(detectorRef.current, canvasRef.current, video, video.videoWidth, video.videoHeight)
        if (stopped) return
        if (text) return done(text)
      }
      timer = setTimeout(scan, SCAN_INTERVAL_MS)
    }

    async function start() {
      detectorRef.current = await createNativeDetector()
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setStarting(false)
        setError('เบราว์เซอร์นี้เปิดกล้องไม่ได้ — ใช้ปุ่ม "ถ่ายรูป QR" หรือ "เลือกรูป" ด้านล่างแทน')
        return
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (stopped) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        const video = videoRef.current
        video.srcObject = s
        await video.play().catch(() => {})
        setStarting(false)
        scan()
      } catch (err) {
        setStarting(false)
        setError(
          err?.name === 'NotAllowedError'
            ? 'ไม่ได้รับอนุญาตให้ใช้กล้อง — กดอนุญาตกล้องในการตั้งค่าเบราว์เซอร์ หรือใช้ปุ่ม "ถ่ายรูป QR" แทน'
            : 'เปิดกล้องไม่ได้ — ใช้ปุ่ม "ถ่ายรูป QR" หรือ "เลือกรูป" ด้านล่างแทน',
        )
      }
    }
    start()

    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [open])

  function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = async () => {
      const text = await decode(detectorRef.current, canvasRef.current, img, img.naturalWidth, img.naturalHeight)
      URL.revokeObjectURL(url)
      if (text) {
        onResult(text.trim())
        onClose()
      } else {
        setError('ไม่พบ QR Code ในรูปนี้ ลองถ่ายใหม่ให้ QR อยู่กลางภาพ ชัด และไม่สะท้อนแสง')
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError('เปิดไฟล์รูปนี้ไม่ได้')
    }
    img.src = url
  }

  const btn =
    'flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover-strong)]'

  return (
    <Modal open={open} onClose={onClose} title="สแกนคิวอาร์">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl bg-black">
        {/* playsInline + muted must be set before play() or iPhone Safari shows a black box */}
        <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-[15%] rounded-lg border-2 border-violet-400/80" />
        {starting && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">กำลังเปิดกล้อง…</div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <p className="mt-3 text-center text-sm text-[var(--text-muted)]">ส่อง QR Code ของสินค้าให้อยู่ในกรอบ</p>
      {error && <p className="mt-2 text-center text-sm text-amber-300">{error}</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button type="button" onClick={() => photoRef.current?.click()} className={btn}>
          <Camera size={16} /> ถ่ายรูป QR
        </button>
        <button type="button" onClick={() => galleryRef.current?.click()} className={btn}>
          <ImageUp size={16} /> เลือกรูป
        </button>
      </div>
    </Modal>
  )
}
