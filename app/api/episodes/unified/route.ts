// app/api/episodes/unified/route.ts - ENSURE THIS IS CORRECT
import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import EpisodeModel from "@/app/models/episode";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");
    const status = searchParams.get("status") || "published"; // Default to published

    // Build query - CRITICAL: Only show published AND public episodes
    const query: any = {
      status: "published",
      isPublic: true,
    };

    // Optional topic filter
    if (topic && topic !== "all" && topic !== "null") {
      query.topic = topic;
    }

    console.log("📋 Querying episodes for subscriber:", {
      status: query.status,
      isPublic: query.isPublic,
      topic: query.topic || "all",
    });

    // Get episodes sorted by upload date (newest first)
    const episodes = await EpisodeModel.find(query)
      .sort({ uploadDate: -1 })
      .select("-__v -createdBy -isPublic") // Hide admin fields
      .lean();

    console.log(`✅ Found ${episodes.length} published episodes`);

    return NextResponse.json({
      success: true,
      count: episodes.length,
      data: episodes,
      message:
        episodes.length === 0 ? "No published episodes found" : undefined,
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
