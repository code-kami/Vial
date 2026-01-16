// EpisodeUpload.tsx - Updated handleSubmit function
"use client";

import Button from "@/app/components/button";
import { useState, useRef } from "react";
import * as Unicons from "@iconscout/react-unicons";

interface EpisodeUploadProps {
  onSubmit: (episode: any) => void;
  topics: string[];
}

interface UploadedFile {
  name: string;
  type: "audio" | "cover";
  size: number;
  dataUrl?: string; // For cover images
  file?: File; // For audio files
}

export default function EpisodeUpload({
  onSubmit,
  topics,
}: EpisodeUploadProps) {
  const [newEpisode, setNewEpisode] = useState({
    title: "",
    description: "",
    duration: "",
    topic: "",
    publishDate: "",
    publishTime: "",
  });

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (fileType: "audio" | "cover") => {
    if (fileType === "audio") {
      audioInputRef.current?.click();
    } else {
      coverInputRef.current?.click();
    }
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "audio" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file based on type
    if (fileType === "audio") {
      const validAudioTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/aac",
        "audio/ogg",
      ];
      if (!validAudioTypes.includes(file.type)) {
        alert("Please upload a valid audio file (MP3, WAV, AAC, or OGG)");
        return;
      }

      // Audio files can be large, but we'll upload to Cloudinary
      if (file.size > 200 * 1024 * 1024) {
        // 200MB limit
        alert("Audio file size should be less than 200MB");
        return;
      }
    } else {
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validImageTypes.includes(file.type)) {
        alert("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        alert("Image file size should be less than 10MB");
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    try {
      if (fileType === "cover") {
        // For cover images, create data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;

          setUploadedFiles((prev) => [
            ...prev.filter((f) => f.type !== "cover"),
            {
              name: file.name,
              type: "cover",
              size: file.size,
              dataUrl: dataUrl,
            },
          ]);

          setIsUploading(false);
          setUploadProgress(null);
        };
        reader.readAsDataURL(file);
      } else {
        // For audio files, just store metadata - will upload to Cloudinary in handleSubmit
        setUploadedFiles((prev) => [
          ...prev.filter((f) => f.type !== "audio"),
          {
            name: file.name,
            type: "audio",
            size: file.size,
            file: file,
          },
        ]);

        setIsUploading(false);
        setUploadProgress(null);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // app/components/EpisodeUpload.tsx - Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🎬 Starting episode submission...");

    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!newEpisode.title.trim()) newErrors.title = "Title is required";
    if (!newEpisode.duration.trim())
      newErrors.duration = "Duration is required";
    if (!newEpisode.topic.trim()) newErrors.topic = "Topic is required";

    // Audio file validation
    const audioFile = uploadedFiles.find((f) => f.type === "audio")?.file;
    if (!audioFile) {
      newErrors.audio = "Audio file is required";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.log("❌ Validation errors:", newErrors);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log("📤 Step 1: Uploading audio to Cloudinary...");

      // Step 1: Upload audio to Cloudinary
      let cloudinaryData = null;
      if (audioFile) {
        const audioFormData = new FormData();
        audioFormData.append("audio", audioFile);
        audioFormData.append("fileName", audioFile.name);

        setUploadProgress(20);

        const uploadResponse = await fetch("/api/audio/upload", {
          method: "POST",
          body: audioFormData,
        });

        setUploadProgress(60);

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(
            "❌ Audio upload failed:",
            uploadResponse.status,
            errorText
          );
          throw new Error(`Audio upload failed: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log("📊 Upload result:", uploadResult);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Audio upload failed");
        }

        cloudinaryData = uploadResult.data;
        console.log(
          "✅ Audio uploaded to Cloudinary:",
          cloudinaryData.publicId
        );
      }

      setUploadProgress(80);

      // Determine status based on publish date
      let status: "draft" | "scheduled" | "published" = "draft";
      let isPublic = false;

      if (newEpisode.publishDate) {
        const publishDateTime = new Date(
          `${newEpisode.publishDate}T${newEpisode.publishTime || "00:00"}`
        );
        const now = new Date();

        if (publishDateTime <= now) {
          // If publish date is in the past or now, publish immediately
          status = "published";
          isPublic = true;
        } else {
          // If publish date is in the future, schedule it
          status = "scheduled";
          isPublic = false; // Not public until published
        }
      } else {
        // No publish date = draft
        status = "draft";
        isPublic = false;
      }

      console.log("📅 Status determined:", {
        status,
        isPublic,
        publishDate: newEpisode.publishDate,
      });

      // Step 2: Prepare episode data with Cloudinary URLs
      const episodeData = {
        title: newEpisode.title.trim(),
        description: newEpisode.description.trim(),
        duration: newEpisode.duration.trim(),
        topic: newEpisode.topic.trim(),
        publishDate: newEpisode.publishDate || undefined,
        publishTime: newEpisode.publishTime || undefined,
        status: status, // Use determined status
        uploadDate: new Date().toISOString().split("T")[0],
        // Include Cloudinary audio data
        ...(cloudinaryData && {
          audioUrl: cloudinaryData.url,
          audioPublicId: cloudinaryData.publicId,
          audioFileName: cloudinaryData.fileName,
          audioSize: cloudinaryData.size,
          audioDuration: cloudinaryData.duration,
          audioFormat: cloudinaryData.format,
          audioId: cloudinaryData.publicId,
        }),
        // Cover image (if any)
        coverImage: uploadedFiles.find((f) => f.type === "cover")?.dataUrl,
        isPublic: isPublic, // Set based on status
      };

      console.log("📦 Prepared episode data:", episodeData);

      setUploadProgress(95);

      // Step 3: Submit to parent component
      onSubmit(episodeData);

      setUploadProgress(100);

      // Step 4: Reset form after a brief delay
      setTimeout(() => {
        resetForm();
        console.log("✅ Episode submitted successfully!");
      }, 500);
    } catch (error: any) {
      console.error("❌ Error submitting episode:", error);
      alert(`Failed to upload episode: ${error.message || "Unknown error"}`);
      setIsUploading(false);
      setUploadProgress(null);
    }
  };
  const resetForm = () => {
    setNewEpisode({
      title: "",
      description: "",
      duration: "",
      topic: "",
      publishDate: "",
      publishTime: "",
    });
    setUploadedFiles([]);
    setUploadProgress(null);
    setErrors({});
    setIsUploading(false);
  };

  const removeFile = (fileType: "audio" | "cover") => {
    setUploadedFiles((prev) => prev.filter((f) => f.type !== fileType));
    if (fileType === "audio") {
      setErrors((prev) => ({ ...prev, audio: "" }));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 border border-neutral-800">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Unicons.UilUpload size="24" className="text-lime-400" />
        Upload New Episode
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={audioInputRef}
          onChange={(e) => handleFileSelect(e, "audio")}
          accept="audio/*"
          className="hidden"
        />
        <input
          type="file"
          ref={coverInputRef}
          onChange={(e) => handleFileSelect(e, "cover")}
          accept="image/*"
          className="hidden"
        />

        <FormInput
          label="Episode Title *"
          value={newEpisode.title}
          onChange={(value) => setNewEpisode({ ...newEpisode, title: value })}
          placeholder="e.g., Discipline Is Not Motivation"
          error={errors.title}
          required
        />

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Description
          </label>
          <textarea
            value={newEpisode.description}
            onChange={(e) =>
              setNewEpisode({ ...newEpisode, description: e.target.value })
            }
            placeholder="Episode description for show notes..."
            rows={3}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Duration (HH:MM) *"
            value={newEpisode.duration}
            onChange={(value) =>
              setNewEpisode({ ...newEpisode, duration: value })
            }
            placeholder="1:25:00"
            error={errors.duration}
            required
          />

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Topic *
            </label>
            <select
              value={newEpisode.topic}
              onChange={(e) =>
                setNewEpisode({ ...newEpisode, topic: e.target.value })
              }
              className={`w-full px-4 py-3 bg-neutral-800 border ${
                errors.topic ? "border-red-500" : "border-neutral-700"
              } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
              required
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
            {errors.topic && (
              <p className="mt-1 text-sm text-red-400">{errors.topic}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            type="date"
            label="Schedule Publish Date"
            value={newEpisode.publishDate}
            onChange={(value) =>
              setNewEpisode({ ...newEpisode, publishDate: value })
            }
          />

          <FormInput
            type="time"
            label="Publish Time"
            value={newEpisode.publishTime}
            onChange={(value) =>
              setNewEpisode({ ...newEpisode, publishTime: value })
            }
          />
        </div>

        {/* File Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUploadZone
            icon={
              <Unicons.UilMusic
                size="32"
                className="mx-auto text-neutral-500 mb-3"
              />
            }
            title="Audio File"
            description="MP3, WAV, AAC, OGG up to 200MB"
            onClick={() => handleFileUpload("audio")}
            disabled={isUploading}
            buttonText={isUploading ? "Uploading..." : "Select Audio File"}
            uploadedFile={uploadedFiles.find((f) => f.type === "audio")}
            onRemove={() => removeFile("audio")}
            formatFileSize={formatFileSize}
          />

          <FileUploadZone
            icon={
              <Unicons.UilImage
                size="32"
                className="mx-auto text-neutral-500 mb-3"
              />
            }
            title="Cover Art"
            description="JPG, PNG, GIF up to 10MB"
            onClick={() => handleFileUpload("cover")}
            disabled={isUploading}
            buttonText={isUploading ? "Uploading..." : "Select Cover Art"}
            uploadedFile={uploadedFiles.find((f) => f.type === "cover")}
            onRemove={() => removeFile("cover")}
            formatFileSize={formatFileSize}
          />
        </div>

        {errors.audio && <p className="text-sm text-red-400">{errors.audio}</p>}

        {/* Upload Progress */}
        {uploadProgress !== null && (
          <UploadProgress progress={uploadProgress} />
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            className="flex-1 bg-lime-400 text-black hover:bg-lime-300"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Unicons.UilSpinnerAlt
                  size="18"
                  className="mr-2 animate-spin"
                />
                Uploading...
              </>
            ) : (
              <>
                <Unicons.UilSave size="18" className="mr-2" />
                Save Episode
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isUploading}
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}

// Helper Components (keep these the same)
function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  error = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-neutral-800 border ${
          error ? "border-red-500" : "border-neutral-700"
        } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
        required={required}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

function FileUploadZone({
  icon,
  title,
  description,
  onClick,
  disabled,
  buttonText,
  uploadedFile,
  onRemove,
  formatFileSize,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
  buttonText: string;
  uploadedFile?: UploadedFile;
  onRemove: () => void;
  formatFileSize: (bytes: number) => string;
}) {
  return (
    <div
      className={`border-2 ${
        uploadedFile ? "border-lime-400" : "border-neutral-700"
      } rounded-xl p-4 hover:border-lime-400 transition-colors`}
    >
      {uploadedFile ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {uploadedFile.type === "audio" ? (
                <Unicons.UilMusic size="20" className="text-lime-400" />
              ) : (
                <Unicons.UilImage size="20" className="text-lime-400" />
              )}
              <div>
                <p className="font-medium text-sm truncate max-w-45">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-neutral-400 hover:text-red-400 hover:bg-red-400/20 rounded-full"
              disabled={disabled}
            >
              <Unicons.UilTimes size="16" />
            </button>
          </div>
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              onClick={onClick}
              disabled={disabled}
              className="text-sm w-full"
            >
              Replace File
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          {icon}
          <p className="text-sm font-medium mb-2">{title}</p>
          <p className="text-xs text-neutral-500 mb-3">{description}</p>
          <Button
            type="button"
            variant="outline"
            onClick={onClick}
            disabled={disabled}
            className="text-sm"
          >
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  );
}

function UploadProgress({ progress }: { progress: number }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-neutral-300">Uploading...</span>
        <span className="text-lime-400">{progress}%</span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-lime-400 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
