"use client";

import { useRef, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { UploadCloud, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadDropzone({
  file,
  onFileSelected,
  disabled,
}: {
  file: File | null;
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("forensics.dropzone");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onFileSelected(dropped);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      aria-disabled={disabled}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors",
        isDragging && "border-primary bg-primary/5",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) onFileSelected(selected);
        }}
      />
      {file ? (
        <>
          <FileImage className="size-8 text-primary" aria-hidden />
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">{t("replaceHint")}</p>
        </>
      ) : (
        <>
          <UploadCloud className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium text-foreground">{t("title")}</p>
          <p className="text-xs text-muted-foreground">{t("hint")}</p>
        </>
      )}
    </div>
  );
}
