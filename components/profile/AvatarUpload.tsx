"use client";

import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { profileApi }      from "@/lib/api/profile.api";
import { getErrorMessage } from "@/lib/api/client";
import { getInitials, getAvatarColor } from "@/lib/utils";
import toast from "react-hot-toast";

type AvatarUploadProps = {
  name: string;
  currentAvatarUrl?: string;
  size?: number;
  onUploadComplete?: (url: string) => void;
};

export function AvatarUpload({ name, currentAvatarUrl, size = 80, onUploadComplete }: AvatarUploadProps) {
  var inputRef   = useRef<HTMLInputElement>(null);
  var [previewUrl, setPreviewUrl] = useState<string | undefined>(currentAvatarUrl);
  var [uploading, setUploading]   = useState(false);

  var initials = getInitials(name);
  var bgColor  = getAvatarColor(name);
  var fontSize = Math.round(size * 0.3);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, or WebP files are allowed"); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB"); return;
    }
    var reader = new FileReader();
    reader.onloadend = function() { setPreviewUrl(reader.result as string); };
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      var response = await profileApi.uploadAvatar(file);
      var url = response.data.data.avatarUrl;
      setPreviewUrl(url);
      if (onUploadComplete) onUploadComplete(url);
      toast.success("Avatar updated!");
    } catch(err) {
      toast.error(getErrorMessage(err));
      setPreviewUrl(currentAvatarUrl);
    } finally { setUploading(false); }
  }

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* Avatar */}
      <div
        className={"rounded-full flex items-center justify-center overflow-hidden text-white font-bold " + bgColor}
        style={{
          width: size, height: size, fontSize: fontSize,
          border: "3px solid white",
          boxShadow: "0 0 0 3px #e0e7ff, 0 4px 16px rgba(99,102,241,0.2)"
        }}
      >
        {previewUrl
          ? <img src={previewUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span>{initials}</span>
        }
      </div>

      {/* Camera button */}
      <button
        type="button"
        onClick={function() { if (!uploading && inputRef.current) inputRef.current.click(); }}
        className="absolute bottom-0 right-0 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
        style={{
          width: 26, height: 26, borderRadius: "9999px",
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          border: "2px solid white",
          boxShadow: "0 2px 8px rgba(99,102,241,0.4)"
        }}
        aria-label="Upload avatar"
      >
        {uploading
          ? <Loader2 size={11} className="animate-spin" />
          : <Camera  size={11} />
        }
      </button>

      <input
        ref={inputRef} type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange} className="hidden"
      />
    </div>
  );
}