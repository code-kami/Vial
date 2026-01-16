// app/api/test-cloudinary/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function GET() {
  console.log("🔍 Testing Cloudinary configuration...");

  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  console.log("Config:", {
    cloud_name: config.cloud_name ? "Set" : "Missing",
    api_key: config.api_key
      ? "Set (first 5 chars): " + config.api_key.substring(0, 5) + "..."
      : "Missing",
    api_secret: config.api_secret ? "Set" : "Missing",
  });

  // Test Cloudinary connection
  try {
    cloudinary.config(config);

    // Simple ping test
    const result = await cloudinary.api.ping();

    return NextResponse.json({
      success: true,
      message: "Cloudinary is configured correctly",
      config: {
        cloud_name: config.cloud_name,
        api_key_set: !!config.api_key,
        api_secret_set: !!config.api_secret,
      },
      ping: result,
    });
  } catch (error: any) {
    console.error("❌ Cloudinary test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        config: config,
      },
      { status: 500 }
    );
  }
}
