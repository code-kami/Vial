import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

    const idStr = String(episodeId);

    // Try finding by a stored 'id' field first (some episodes stored locally may use this)
    const updatedEpisode = await EpisodeModel.findOneAndUpdate(
      { id: idStr },
      {
        audioUrl: audioData.url,
        audioPublicId: audioData.publicId,
        audioFileName: audioData.fileName,
        audioSize: audioData.size,
        audioDuration: audioData.duration,
        audioFormat: audioData.format,
      },
      { new: true }
    );

    if (updatedEpisode) {
      return NextResponse.json({
        success: true,
        message: "Episode audio updated",
        data: updatedEpisode,
      });
    }

    // If not found by custom id, only attempt to query by _id when the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return NextResponse.json(
        {
          success: false,
          error: "Episode not found (invalid or local-only id)",
        },
        { status: 404 }
      );
    }

    const episodeById = await EpisodeModel.findByIdAndUpdate(
      idStr,
      {
        audioUrl: audioData.url,
        audioPublicId: audioData.publicId,
        audioFileName: audioData.fileName,
        audioSize: audioData.size,
        audioDuration: audioData.duration,
        audioFormat: audioData.format,
      },
      { new: true }
    );

    if (!episodeById) {
      return NextResponse.json(
        { success: false, error: "Episode not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Episode audio updated",
      data: episodeById,
    });
  } catch (error: any) {
    console.error("Update audio error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update episode" },
      { status: 500 }
    );
  }
}
