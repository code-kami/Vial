"use server";
import { revalidatePath } from "next/cache";
import dbConnect from "./dbConnect";
import EpisodeModel from "../models/episode";
import SubscriberModel from "../models/subscriber";
import { sendWelcomeEmail } from "./sendmail";
import * as bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { encrypt, decrypt } from "./session";
import { v2 as cloudinary } from "cloudinary";

// Helpers to sanitize DB results into plain serializable objects
function sanitizeSubscriber(u: any) {
  if (!u) return u;
  const obj = { ...u };
  // If Mongoose document, ensure we have plain values
  if (obj._id && typeof obj._id === "object" && obj._id.toString) {
    obj._id = obj._id.toString();
  } else {
    obj._id = String(obj._id);
  }
  if (obj.joinDate) obj.joinDate = new Date(obj.joinDate).toISOString();
  if (obj.createdAt) obj.createdAt = new Date(obj.createdAt).toISOString();
  if (obj.updatedAt) obj.updatedAt = new Date(obj.updatedAt).toISOString();
  return obj;
}

function sanitizeEpisode(ep: any) {
  if (!ep) return ep;
  const obj = { ...ep };
  if (obj._id && typeof obj._id === "object" && obj._id.toString) {
    obj._id = obj._id.toString();
  } else {
    obj._id = String(obj._id);
  }
  if (obj.uploadDate) obj.uploadDate = new Date(obj.uploadDate).toISOString();
  if (obj.publishDate)
    obj.publishDate = new Date(obj.publishDate).toISOString();
  return obj;
}

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Helper function to verify password
async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// =============== SUBSCRIBER ACTIONS ===============

export const signUp = async (userData: {
  name: string;
  email: string;
  password: string;
  username?: string;
}) => {
  try {
    await dbConnect();

    // Check if user already exists
    const existingUser = await SubscriberModel.findOne({
      email: userData.email.toLowerCase(),
    });
    if (existingUser) {
      return {
        success: false,
        message: "User with this email already exists",
      };
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create user
    const newUser = await SubscriberModel.create({
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      passwordHash,
      username:
        userData.username?.trim() || userData.name.split(" ")[0].toLowerCase(),
      joinDate: new Date(),
      status: "active",
    });

    // Send welcome email - MUST succeed for signup to complete
    const emailResult = await sendWelcomeEmail(userData.email, userData.name);

    if (!emailResult.success) {
      // Email failed - rollback user creation
      await SubscriberModel.findByIdAndDelete(newUser._id);

      return {
        success: false,
        message:
          "Failed to send welcome email. Please check your email address and try again.",
      };
    }

    // Email sent successfully - proceed with session creation
    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;

    // Create session
    const cookieStore = await cookies();
    const token = await encrypt({ _id: newUser._id.toString() });

    cookieStore.set("vial_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return {
      success: true,
      message: "Sign up successful! Welcome email sent.",
      data: sanitizeSubscriber(userResponse),
    };
  } catch (error: any) {
    console.error("Sign up error:", error);
    return {
      success: false,
      message: error.message || "Failed to sign up",
    };
  }
};
export const login = async (credentials: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) => {
  try {
    await dbConnect();

    // Find user
    const user = await SubscriberModel.findOne({
      email: credentials.email.toLowerCase(),
    });

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      credentials.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Update last login
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Remove password hash from response
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    // Create session
    const cookieStore = await cookies();
    const token = await encrypt({ _id: user._id.toString() });

    cookieStore.set("vial_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: credentials.rememberMe
        ? 60 * 60 * 24 * 30 // 30 days for "remember me"
        : 60 * 60 * 24 * 7, // 7 days standard
    });

    return {
      success: true,
      message: "Login successful!",
      data: sanitizeSubscriber(userResponse),
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      message: error.message || "Failed to login",
    };
  }
};

export const getSession = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("vial_token");

    if (!token) {
      return { success: false, isAuthenticated: false };
    }

    const decoded = await decrypt(token.value);
    if (!decoded || !decoded.success || !decoded._id) {
      return { success: false, isAuthenticated: false };
    }

    await dbConnect();
    const user = await SubscriberModel.findById(decoded._id).select(
      "-passwordHash"
    );

    if (!user) {
      return { success: false, isAuthenticated: false };
    }

    return {
      success: true,
      isAuthenticated: true,
      data: sanitizeSubscriber(user.toObject()),
    };
  } catch (error) {
    console.error("Session error:", error);
    return { success: false, isAuthenticated: false };
  }
};

export const logout = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("vial_token");

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error: any) {
    console.error("Logout error:", error);
    return {
      success: false,
      message: error.message || "Failed to logout",
    };
  }
};

// Add this function to your existing actions.ts file
// Place it near the other audio-related functions

export const deleteAudioFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    // You have two options:

    // OPTION 1: Direct API call (Simplest)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary credentials not configured");
    }

    // Create signature for authenticated request
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
    
    // In a real implementation, you'd create a signature
    // For now, let's use a simpler approach:

    // OPTION 2: Use Cloudinary SDK (Recommended)
    // First, install: npm install cloudinary
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video', // Audio files are treated as video in Cloudinary
      invalidate: true, // Also invalidate CDN cache
    });

    console.log(`✅ Cloudinary audio deleted: ${publicId}`);
    
  } catch (error: any) {
    console.error('❌ Cloudinary delete error:', error);
    throw new Error(`Failed to delete audio from Cloudinary: ${error.message}`);
  }
};
// export const addUser = async (userData: {
//   name: string;
//   email: string;
//   password: string;
// }) => {
//   try {
//     // This is essentially the same as signUp but for admin purposes
//     const result = await signUp(userData);

//     if (result.success) {
//       try {
//         await sendWelcomeEmail(userData.email, userData.name);
//       } catch (emailError) {
//         console.error("Failed to send welcome email:", emailError);
//       }
//     }

//     return result;
//   } catch (error: any) {
//     console.error("Add user error:", error);
//     return {
//       success: false,
//       message: error.message || "Failed to add user",
//     };
//   }
// };

export const updateProfile = async (
  userId: string,
  updateData: {
    name?: string;
    username?: string;
    bio?: string;
    favoriteTopic?: string;
    avatarId?: number;
    avatarUrl?: string;
    notifications?: boolean;
    newsletter?: boolean;
  }
) => {
  try {
    await dbConnect();

    // Update user
    const updatedUser = await SubscriberModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/profile");
    revalidatePath("/subscriber");

    return {
      success: true,
      message: "Profile updated successfully",
      data: sanitizeSubscriber(updatedUser.toObject()),
    };
  } catch (error: any) {
    console.error("Update profile error:", error);
    return {
      success: false,
      message: error.message || "Failed to update profile",
    };
  }
};

export const deleteAccount = async (userId: string) => {
  try {
    await dbConnect();

    const deletedUser = await SubscriberModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Also logout the user
    const cookieStore = await cookies();
    cookieStore.delete("vial_token");

    return {
      success: true,
      message: "Account deleted successfully",
    };
  } catch (error: any) {
    console.error("Delete account error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete account",
    };
  }
};

// =============== EPISODE ACTIONS ===============

export const uploadEpisode = async (episodeData: {
  title: string;
  description: string;
  duration: string;
  topic: string;
  status?: "draft" | "scheduled" | "published";
  publishDate?: Date;
  publishTime?: string;
  audioId?: string;
  audioFileName?: string;
  coverImage?: string;
  audioData?: {
    filename: string;
    mimeType: string;
    size: number;
    data?: Buffer;
  };
  createdBy?: string;
}) => {
  try {
    await dbConnect();

    const newEpisode = await EpisodeModel.create({
      ...episodeData,
      uploadDate: new Date(),
      listens: 0,
      status: episodeData.status || "draft",
    });

    revalidatePath("/admin");
    revalidatePath("/subscriber");

    return {
      success: true,
      message: "Episode uploaded successfully",
      data: sanitizeEpisode(newEpisode.toObject()),
    };
  } catch (error: any) {
    console.error("Upload episode error:", error);
    return {
      success: false,
      message: error.message || "Failed to upload episode",
    };
  }
};

export const editEpisode = async (
  episodeId: string,
  updateData: {
    title?: string;
    description?: string;
    duration?: string;
    topic?: string;
    status?: "draft" | "scheduled" | "published";
    publishDate?: Date;
    publishTime?: string;
    listens?: number;
    coverImage?: string;
  }
) => {
  try {
    await dbConnect();

    const updatedEpisode = await EpisodeModel.findByIdAndUpdate(
      episodeId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEpisode) {
      return {
        success: false,
        message: "Episode not found",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/subscriber");

    return {
      success: true,
      message: "Episode updated successfully",
      data: sanitizeEpisode(updatedEpisode.toObject()),
    };
  } catch (error: any) {
    console.error("Edit episode error:", error);
    return {
      success: false,
      message: error.message || "Failed to update episode",
    };
  }
};

export const deleteEpisode = async (episodeId: string) => {
  try {
    await dbConnect();

    const deletedEpisode = await EpisodeModel.findByIdAndDelete(episodeId);

    if (!deletedEpisode) {
      return {
        success: false,
        message: "Episode not found",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/subscriber");

    return {
      success: true,
      message: "Episode deleted successfully",
    };
  } catch (error: any) {
    console.error("Delete episode error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete episode",
    };
  }
};

export const getEpisodes = async (filters?: {
  status?: "draft" | "scheduled" | "published";
  topic?: string;
  search?: string;
  limit?: number;
}) => {
  try {
    await dbConnect();

    let query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.topic) {
      query.topic = filters.topic;
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
        { topic: { $regex: filters.search, $options: "i" } },
      ];
    }

    const limit = filters?.limit || 100;
    const episodes = await EpisodeModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const sanitized = episodes.map((ep: any) => sanitizeEpisode(ep));

    return {
      success: true,
      data: sanitized,
    };
  } catch (error: any) {
    console.error("Get episodes error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch episodes",
      data: [],
    };
  }
};

export const getSubscribers = async (filters?: {
  status?: "active" | "inactive";
  search?: string;
}) => {
  try {
    await dbConnect();

    let query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { username: { $regex: filters.search, $options: "i" } },
      ];
    }

    const subscribers = await SubscriberModel.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    const sanitized = subscribers.map((s: any) => sanitizeSubscriber(s));

    return {
      success: true,
      data: sanitized,
    };
  } catch (error: any) {
    console.error("Get subscribers error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch subscribers",
      data: [],
    };
  }
};

export const updateSubscriberStatus = async (
  subscriberId: string,
  status: "active" | "inactive"
) => {
  try {
    await dbConnect();

    const updatedSubscriber = await SubscriberModel.findByIdAndUpdate(
      subscriberId,
      { status },
      { new: true }
    ).select("-passwordHash");

    if (!updatedSubscriber) {
      return {
        success: false,
        message: "Subscriber not found",
      };
    }

    return {
      success: true,
      message: `Subscriber status updated to ${status}`,
      data: sanitizeSubscriber(updatedSubscriber.toObject()),
    };
  } catch (error: any) {
    console.error("Update subscriber status error:", error);
    return {
      success: false,
      message: error.message || "Failed to update subscriber status",
    };
  }
};
