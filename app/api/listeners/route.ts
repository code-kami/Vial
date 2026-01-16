import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import Listener from "@/app/models/subscriber";
import crypto from "crypto";

// Helper to hash passwords using scrypt (node's built-in)
function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export async function GET() {
  try {
    await dbConnect();
    const listeners = await Listener.find({}, { passwordHash: 0 })
      .sort({ createdAt: -1 })
      .lean();

    // Convert ObjectId and dates to plain serializable values
    const sanitized = (listeners || []).map((l: any) => ({
      ...l,
      _id: l._id && l._id.toString ? l._id.toString() : String(l._id),
      createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : undefined,
      updatedAt: l.updatedAt ? new Date(l.updatedAt).toISOString() : undefined,
      joinDate: l.joinDate ? new Date(l.joinDate).toISOString() : undefined,
    }));

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await Listener.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    const created = await Listener.create({ name, email, passwordHash });
    let result: any = created.toObject();
    delete (result as any).passwordHash;

    // Ensure plain serializable values (no ObjectId/Buffers)
    result._id =
      result._id && result._id.toString
        ? result._id.toString()
        : String(result._id);
    if (result.createdAt)
      result.createdAt = new Date(result.createdAt).toISOString();
    if (result.updatedAt)
      result.updatedAt = new Date(result.updatedAt).toISOString();

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    }

    const update: any = {};
    if (status && (status === "active" || status === "inactive")) {
      update.status = status;
    }

    // Accept optional numeric updates for episodesCompleted or totalTime
    if (typeof body.episodesCompleted === "number")
      update.episodesCompleted = body.episodesCompleted;
    if (typeof body.totalTime === "number") update.totalTime = body.totalTime;

    const updated = await Listener.findByIdAndUpdate(id, update, {
      new: true,
      projection: { passwordHash: 0 },
    }).lean();
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Listener not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
