// app/api/episodes/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import EpisodeModel from "@/app/models/episode";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { episodeId, updates } = body;

    console.log("📝 Update episode request:", { episodeId, updates });

    if (!episodeId || !updates) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Clean updates - remove undefined fields
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    console.log("🧹 Cleaned updates:", cleanUpdates);

    let updatedEpisode;

    // Try to find and update by MongoDB _id first
    if (mongoose.Types.ObjectId.isValid(episodeId)) {
      console.log("🔍 Searching by MongoDB _id:", episodeId);
      updatedEpisode = await EpisodeModel.findByIdAndUpdate(
        episodeId,
        { $set: cleanUpdates },
        { new: true, runValidators: true }
      );
    }

    // If not found by _id, try to find by custom id field
    if (!updatedEpisode) {
      console.log("🔍 Searching by custom id field:", episodeId);
      updatedEpisode = await EpisodeModel.findOneAndUpdate(
        { id: episodeId },
        { $set: cleanUpdates },
        { new: true, runValidators: true }
      );
    }

    // If still not found, try to find by title or other identifier
    if (!updatedEpisode && updates.title) {
      console.log("🔍 Searching by title:", updates.title);
      updatedEpisode = await EpisodeModel.findOneAndUpdate(
        { title: updates.title },
        { $set: cleanUpdates },
        { new: true, runValidators: true }
      );
    }

    if (!updatedEpisode) {
      console.error("❌ Episode not found with ID:", episodeId);
      return NextResponse.json(
        { success: false, error: "Episode not found" },
        { status: 404 }
      );
    }

    console.log("✅ Episode updated:", updatedEpisode._id);

    return NextResponse.json({
      success: true,
      message: "Episode updated successfully",
      data: updatedEpisode,
    });
  } catch (error: any) {
    console.error("❌ Error updating episode:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update episode",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
