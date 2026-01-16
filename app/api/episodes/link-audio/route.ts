// app/api/episodes/link-audio/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import EpisodeModel from "@/app/models/episode";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { episodeId, audioData } = body;

    if (!episodeId || !audioData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const episode = await EpisodeModel.findByIdAndUpdate(
      episodeId,
      {
        audioUrl: audioData.url,
        audioPublicId: audioData.publicId,
        audioFileName: audioData.fileName,
        audioSize: audioData.size,
        audioDuration: audioData.duration,
        audioFormat: audioData.format,
        audioId: audioData.publicId,
        status: "published", // Auto-publish when audio is uploaded
        isPublic: true,
      },
      { new: true }
    );

    if (!episode) {
      return NextResponse.json(
        { success: false, error: "Episode not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Audio linked to episode successfully",
      data: episode,
    });
  } catch (error: any) {
    console.error("Error linking audio:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to link audio" },
      { status: 500 }
    );
  }
}
