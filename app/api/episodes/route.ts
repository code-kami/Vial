// app/api/episodes/route.ts - Add checkOnly parameter
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import EpisodeModel from "@/app/models/episode";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const checkOnly = searchParams.get("checkOnly") === "true";

    if (checkOnly) {
      // Just return the last update timestamp for polling
      const lastEpisode = await EpisodeModel.findOne()
        .sort({ updatedAt: -1 })
        .select("updatedAt")
        .lean();

      return NextResponse.json({
        success: true,
        lastUpdate: lastEpisode?.updatedAt
          ? new Date(lastEpisode.updatedAt).getTime()
          : 0,
      });
    }

    // Get all episodes, sorted by upload date
    const episodes = await EpisodeModel.find()
      .sort({ uploadDate: -1 })
      .select("-__v")
      .lean();

    return NextResponse.json({
      success: true,
      data: episodes,
      lastUpdate:
        episodes.length > 0
          ? new Date(episodes[0].updatedAt || Date.now()).getTime()
          : Date.now(),
    });
  } catch (error: any) {
    console.error("Error fetching episodes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch episodes",
      },
      { status: 500 }
    );
  }
}
