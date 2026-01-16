import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload audio file to Cloudinary
// app/utils/cloudinary.ts - Add validation
export async function uploadAudioToCloudinary(
  file: File,
  episodeId: string
): Promise<{
  url: string;
  publicId: string;
  duration: number;
  format: string;
  size: number;
}> {
  try {
    // Validate file size before upload (max 200MB)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
    }

    // Validate file type
    const validTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/aac",
      "audio/ogg",
      "audio/flac",
    ];
    
    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Please upload MP3, WAV, AAC, OGG, or FLAC files.");
    }

    // Convert to base64 for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Audio, {
      resource_type: "video",
      folder: "vial-audios",
      public_id: `episode_${episodeId}_${Date.now()}`,
      upload_preset: "vial_audio_preset",
      overwrite: false,
      tags: ["podcast", "audio", "vial"],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration || 0,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw error;
  }
}
// Delete audio from Cloudinary
export async function deleteAudioFromCloudinary(
  publicId: string
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
    console.log(`✅ Cloudinary audio deleted: ${publicId}`);
  } catch (error) {
    console.error("❌ Cloudinary delete error:", error);
    throw error;
  }
}

// Generate audio waveform image URL
export function generateWaveformUrl(
  publicId: string,
  width = 800,
  height = 200
): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [
      { width, height, crop: "limit" },
      { effect: "waveform" },
      { background: "auto:predominant" },
    ],
  });
}

// Generate audio thumbnail
export function generateAudioThumbnail(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [
      { width: 300, height: 300, crop: "fill" },
      { effect: "blur:1000" },
      { opacity: 50 },
      { color: "auto:predominant" },
    ],
  });
}
