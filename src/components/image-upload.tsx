"use client";

import { useState, useRef, useCallback } from "react";
import { ImageIcon, Upload, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface UploadResult {
  filename: string;
  width: number | null;
  height: number | null;
}

interface ImageUploadProps {
  value: UploadResult | null;
  onChange: (result: UploadResult | null) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const imageUrl = value
    ? `/api/images/${value.filename}`
    : null;

  const displaySrc = preview ?? imageUrl;

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        toast.error("Nur JPEG, PNG oder WebP erlaubt");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Datei zu groß (max. 10 MB)");
        return;
      }

      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      setUploading(true);
      setProgress(10);

      try {
        const formData = new FormData();
        formData.append("file", file);

        // Fake progress while waiting
        const interval = setInterval(() => {
          setProgress((p) => Math.min(p + 15, 85));
        }, 300);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(interval);
        setProgress(100);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error ?? "Upload fehlgeschlagen");
          setPreview(null);
          onChange(null);
          return;
        }

        const data = await res.json();
        onChange({ filename: data.filename, width: data.width, height: data.height });
        setPreview(null); // Will show via imageUrl now
      } catch {
        toast.error("Upload fehlgeschlagen");
        setPreview(null);
        onChange(null);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
  };

  return (
    <div className="space-y-2">
      {displaySrc ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt="Vorschau"
            className="w-40 h-40 object-cover rounded-xl border border-purple-700/50"
            width={value?.width ?? 160}
            height={value?.height ?? 160}
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
              <div className="text-white text-sm">{progress}%</div>
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-800/40 hover:bg-purple-700/40 rounded-lg text-purple-200 transition-colors border border-purple-700/40"
            >
              <RefreshCw size={12} />
              Ersetzen
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-900/30 hover:bg-red-800/30 rounded-lg text-red-300 transition-colors border border-red-800/30"
            >
              <X size={12} />
              Entfernen
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
            dragging
              ? "border-amber-400 bg-amber-400/10"
              : "border-purple-700/50 hover:border-purple-500/70 bg-black/20"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} className="text-purple-400 animate-pulse" />
              <div className="w-32 h-1.5 bg-purple-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-purple-400">Hochladen…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-purple-500">
              <ImageIcon size={28} />
              <span className="text-sm">Bild hierher ziehen oder klicken</span>
              <span className="text-xs">JPEG, PNG, WebP – max. 10 MB</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
