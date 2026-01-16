// app/api/audio/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteAudioFromCloudinary } from "@/app/utils/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: "No public ID provided" },
        { status: 400 }
      );
    }

    await deleteAudioFromCloudinary(publicId);

    return NextResponse.json({
      success: true,
      message: "Audio deleted from Cloudinary",
    });
  } catch (error: any) {
    console.error("Audio delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete audio",
      },
      { status: 500 }
    );
  }
}
