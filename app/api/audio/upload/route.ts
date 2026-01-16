import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const maxDuration = 300;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log(
      "Uploading audio:",
      file.name,
      (file.size / 1024 / 1024).toFixed(2),
      "MB"
    );

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "video",
            folder: "vial/audio",
            timeout: 300000,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        duration: uploadResult.duration,
        format: uploadResult.format,
        size: uploadResult.bytes,
        fileName: file.name,
      },
    });
  } catch (error: any) {
    console.error("Audio upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Request Timeout",
        step: "audio_upload_process",
      },
      { status: 500 }
    );
  }
}
