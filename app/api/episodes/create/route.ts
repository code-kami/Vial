// app/api/episodes/create/route.ts

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Process the newEpisode data from the body
    // e.g., save to database, perform validation
    console.log("Received new episode:", body);

    // Example: Save to a database
    // const newEpisode = await db.episode.create({ data: body });

    return NextResponse.json(
      { message: "Episode created successfully", episode: body },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating episode:", error);
    return NextResponse.json(
      { message: "Error creating episode", error: error.message },
      { status: 500 }
    );
  }
}
