// app/api/episodes/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import { uploadAudioToCloudinary } from "@/app/utils/cloudinary";
import Episode , { IEpisode } from "@/app/models/episode";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Helper function to determine episode status
function determineEpisodeStatus(publishDate?: string, publishTime?: string) {
  let status: "draft" | "scheduled" | "published" = "draft";
  let isPublic = false;

  if (publishDate) {
    const publishDateTime = new Date(
      `${publishDate}T${publishTime || "00:00"}`
    );
    const now = new Date();

    if (publishDateTime <= now) {
      status = "published";
      isPublic = true;
    } else {
      status = "scheduled";
      isPublic = false;
    }
  }

  return { status, isPublic };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication (optional - uncomment if you have auth)
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'Unauthorized'
    //   }, { status: 401 });
    // }

    // 2. Parse form data
    const formData = await request.formData();

    // Get episode metadata
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const duration = formData.get("duration") as string;
    const topic = formData.get("topic") as string;
    const publishDate = formData.get("publishDate") as string;
    const publishTime = formData.get("publishTime") as string;

    // Get files
    const audioFile = formData.get("audio") as File;
    const coverImageData = formData.get("coverImage") as string; // Data URL

    console.log("📥 Received upload request:", {
      title,
      duration,
      topic,
      hasAudio: !!audioFile,
      hasCoverImage: !!coverImageData,
    });

    // 3. Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    if (!duration?.trim()) {
      return NextResponse.json(
        { success: false, error: "Duration is required" },
        { status: 400 }
      );
    }

    if (!topic?.trim()) {
      return NextResponse.json(
        { success: false, error: "Topic is required" },
        { status: 400 }
      );
    }

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "Audio file is required" },
        { status: 400 }
      );
    }

    // 4. Connect to MongoDB
    await dbConnect();
    console.log("✅ Connected to MongoDB");

    // 5. Upload audio to Cloudinary
    console.log("☁️ Uploading audio to Cloudinary...");
    let cloudinaryResult: any;

    try {
      cloudinaryResult = await uploadAudioToCloudinary(
        audioFile,
        audioFile.name
      );
      console.log(
        "✅ Audio uploaded to Cloudinary:",
        cloudinaryResult.public_id
      );
    } catch (uploadError: any) {
      console.error("❌ Cloudinary upload failed:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: `Audio upload failed: ${uploadError.message}`,
          step: "cloudinary_upload",
        },
        { status: 500 }
      );
    }

    // 6. Determine episode status
    const { status, isPublic } = determineEpisodeStatus(
      publishDate,
      publishTime
    );

    // 7. Calculate scheduled date
    let scheduledDate = undefined;
    if (publishDate) {
      const time = publishTime || "00:00";
      scheduledDate = new Date(`${publishDate}T${time}`);
    }

    // 8. Prepare episode data for MongoDB
    const episodeData = {
      title: title.trim(),
      description: description?.trim() || undefined,
      duration: duration.trim(),
      topic: topic.trim(),
      status,
      isPublic,

      // Cloudinary audio data
      audioUrl: cloudinaryResult.secure_url,
      audioPublicId: cloudinaryResult.public_id,
      audioFileName: audioFile.name,
      audioSize: audioFile.size,
      audioDuration: cloudinaryResult.duration || undefined,
      audioFormat: cloudinaryResult.format,

      // Cover image
      coverImage: coverImageData || undefined,

      // Dates
      publishDate: publishDate ? new Date(publishDate) : undefined,
      publishTime: publishTime || undefined,
      scheduledDate: scheduledDate,
      publishedAt: status === "published" ? new Date() : undefined,
    };

    // 9. Save to MongoDB
    console.log("💾 Saving episode to MongoDB...");

    let savedEpisode: IEpisode;
    try {
      savedEpisode = await Episode.create(episodeData);
      console.log("✅ Episode saved to MongoDB:", savedEpisode._id);
    } catch (dbError: any) {
      console.error("❌ MongoDB save failed:", dbError);

      // Optional: Delete from Cloudinary if MongoDB save fails
      try {
        const cloudinary = require("cloudinary").v2;
        await cloudinary.uploader.destroy(cloudinaryResult.public_id, {
          resource_type: "video",
        });
        console.log("🗑️ Cleaned up Cloudinary upload after DB failure");
      } catch (cleanupError) {
        console.error("Failed to cleanup Cloudinary:", cleanupError);
      }

      return NextResponse.json(
        {
          success: false,
          error: `Failed to save episode: ${dbError.message}`,
          step: "mongodb_save",
        },
        { status: 500 }
      );
    }

    // 10. Return success response
    return NextResponse.json({
      success: true,
      message: "Episode uploaded and saved successfully",
      data: {
        episodeId: savedEpisode._id,
        title: savedEpisode.title,
        status: savedEpisode.status,
        audioUrl: savedEpisode.audioUrl,
        coverImage: savedEpisode.coverImage,
        scheduledDate: savedEpisode.scheduledDate,
        createdAt: savedEpisode.createdAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Unexpected error in save endpoint:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
        step: "unexpected_error",
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve episodes
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status");

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const episodes = await Episode.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Episode.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: episodes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching episodes:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
