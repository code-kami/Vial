"use client";

import { useState, useRef } from "react";
import * as Unicons from "@iconscout/react-unicons";
import Button from "@/app/components/button";

interface EpisodeAudioUploadProps {
  episodeId: string | number;
  episodeTitle: string;
  currentAudioUrl?: string;
  currentFileName?: string;
  onUploadComplete: (data: {
    audioUrl: string;
    publicId: string;
    fileName: string;
    size: number;
    duration: number;
    format: string;
  }) => void;
}

export default function EpisodeAudioUpload({
  episodeId,
  episodeTitle,
  currentAudioUrl,
  currentFileName,
  onUploadComplete,
}: EpisodeAudioUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file...

  setIsUploading(true);
  setUploadProgress(0);
  setError(null);
  setSuccess(false);

  try {
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("episodeId", episodeId.toString());

    // Step 1: Upload to Cloudinary
    const uploadResponse = await fetch("/api/audio/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "Upload failed");
    }

    const audioData = uploadResult.data;

    // Step 2: Link audio to episode in MongoDB
    const linkResponse = await fetch("/api/episodes/link-audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        episodeId,
        audioData: audioData,
      }),
    });

    const linkResult = await linkResponse.json();

    if (linkResult.success) {
      setSuccess(true);
      // Notify parent component
      onUploadComplete(audioData);
      setTimeout(() => setSuccess(false), 3000);

      // Refresh the page or update state
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } else {
      throw new Error(linkResult.error || "Failed to link audio to episode");
    }
  } catch (err: any) {
    setError(err.message || "Upload failed");
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-neutral-800 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-lg">Upload Audio to Episode</h3>
          <p className="text-sm text-neutral-400">{episodeTitle}</p>
          <p className="text-xs text-neutral-500">Episode ID: {episodeId}</p>
        </div>

        {currentAudioUrl ? (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
              Audio Exists
            </span>
            <a
              href={currentAudioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-lime-400 hover:text-lime-300"
            >
              Preview
            </a>
          </div>
        ) : (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
            Missing Audio
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="audio/*"
        className="hidden"
        disabled={isUploading}
      />

      <div className="space-y-4">
        {/* Upload Button */}
        <Button
          onClick={triggerFileInput}
          disabled={isUploading}
          className="w-full justify-center"
        >
          {isUploading ? (
            <>
              <Unicons.UilSpinnerAlt size="18" className="mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Unicons.UilUpload size="18" className="mr-2" />
              {currentAudioUrl ? "Replace Audio File" : "Upload Audio File"}
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-300">Upload Progress</span>
              <span className="text-lime-400">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-lime-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Requirements */}
        <div className="text-xs text-neutral-500 space-y-1">
          <p>✓ Supported formats: MP3, WAV, AAC, OGG, FLAC</p>
          <p>✓ Maximum file size: 100MB</p>
          <p>✓ Files are uploaded to Cloudinary CDN</p>
        </div>

        {/* Current File Info */}
        {currentFileName && (
          <div className="border-t border-neutral-700 pt-4">
            <h4 className="text-sm font-medium mb-2">Current Audio</h4>
            <div className="flex items-center gap-2 text-sm">
              <Unicons.UilMusic size="16" className="text-neutral-400" />
              <span className="text-neutral-300">{currentFileName}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <Unicons.UilExclamationTriangle size="16" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <Unicons.UilCheckCircle size="16" />
              <span className="text-sm">Audio uploaded successfully!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
