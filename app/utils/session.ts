import { jwtVerify, SignJWT } from "jose";
import "server-only";
import { cookies } from "next/headers";

const encodedKey = new TextEncoder().encode(process.env.JWT_SECRET);

export const encrypt = async (payload: { _id: string }): Promise<string> => {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2d")
    .sign(encodedKey);

  return token;
};

export const decrypt = async (token: string): Promise<any> => {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return { ...payload, success: true };
  } catch (error) {
    return { success: false };
  }
};

export const auth = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return { success: false };
  }
  const { _id, success } = await decrypt(token);

  if (!success) {
    return { success: false };
  }

  return { _id, success: true };
};
