// app/api/cron/publish-scheduled/route.ts (Optional - for auto-publishing)
import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import EpisodeModel from "@/app/models/episode";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(":").slice(0, 2).join(":");

    console.log("🕒 Checking for scheduled episodes to publish...", {
      currentDate,
      currentTime,
    });

    // Find episodes that are scheduled and their publish time has passed
    const episodesToPublish = await EpisodeModel.find({
      status: "scheduled",
      $or: [
        // Publish date has passed
        {
          publishDate: { $lt: currentDate },
        },
        // Publish date is today and time has passed
        {
          publishDate: currentDate,
          publishTime: { $lte: currentTime },
        },
      ],
    });

    console.log(`📅 Found ${episodesToPublish.length} episodes to publish`);

    if (episodesToPublish.length > 0) {
      const updatePromises = episodesToPublish.map(async (episode) => {
        await EpisodeModel.findByIdAndUpdate(episode._id, {
          status: "published",
          isPublic: true,
        });
        console.log(`✅ Published: ${episode.title}`);
      });

      await Promise.all(updatePromises);
    }

    return NextResponse.json({
      success: true,
      published: episodesToPublish.length,
      episodes: episodesToPublish.map((ep) => ({
        id: ep._id,
        title: ep.title,
        publishDate: ep.publishDate,
        publishTime: ep.publishTime,
      })),
    });
  } catch (error: any) {
    console.error("Error in publish cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process scheduled episodes",
      },
      { status: 500 }
    );
  }
}
