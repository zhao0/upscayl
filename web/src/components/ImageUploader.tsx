import { useCallback, useState } from "react";
import { Upload, ImagePlus, X } from "lucide-react";

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  disabled?: boolean;
  onClear: () => void;
}

export default function ImageUploader({
  onFileSelect,
  selectedFile,
  previewUrl,
  disabled,
  onClear,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [onFileSelect]
  );

  if (previewUrl && selectedFile) {
    return (
      <div className="relative group h-full flex items-center justify-center">
        <img
          src={previewUrl}
          alt="Selected image preview"
          className="max-h-full max-w-full object-contain rounded-xl shadow-xl"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 rounded-xl flex items-center justify-center">
          <button
            onClick={onClear}
            disabled={disabled}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 btn btn-circle btn-error btn-sm shadow-lg"
          >
            <X size={16} />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 right-3 bg-base-300/80 backdrop-blur-md rounded-lg px-3 py-2 text-xs text-base-content/70 flex justify-between">
          <span className="truncate mr-2">{selectedFile.name}</span>
          <span className="shrink-0">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
      </div>
    );
  }

  return (
    <label
      className={`
        flex flex-col items-center justify-center w-full h-full
        rounded-2xl border-2 border-dashed cursor-pointer
        transition-all duration-300 ease-out
        ${
          isDragging
            ? "drag-active border-primary bg-primary/10 scale-[1.02]"
            : "border-base-content/20 hover:border-primary/50 hover:bg-base-200/50"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff"
        onChange={handleFileInput}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-4 p-8">
        <div
          className={`
          w-20 h-20 rounded-2xl flex items-center justify-center
          transition-all duration-300
          ${isDragging ? "bg-primary/20 scale-110" : "bg-base-200"}
        `}
        >
          {isDragging ? (
            <ImagePlus size={36} className="text-primary animate-bounce" />
          ) : (
            <Upload size={36} className="text-base-content/40" />
          )}
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-base-content/80">
            {isDragging ? "释放以上传图片" : "拖拽图片到此处"}
          </p>
          <p className="text-sm text-base-content/50 mt-1">
            或点击选择文件 · 支持 PNG, JPG, WebP, BMP, TIFF
          </p>
          <p className="text-xs text-base-content/30 mt-2">最大 50 MB</p>
        </div>
      </div>
    </label>
  );
}
