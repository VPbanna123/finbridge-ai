import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB decoded
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export const isCloudinaryConfigured = () =>
  Boolean(
    env.CLOUDINARY_URL ||
      (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)
  );

let configured = false;
const ensureConfigured = () => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      500,
      "Image upload is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the backend .env"
    );
  }
  if (!configured) {
    if (
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    ) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });
    } else if (env.CLOUDINARY_URL) {
      // `true` resets the SDK config and parses process.env.CLOUDINARY_URL.
      cloudinary.config(true);
    }
    configured = true;
  }
};

/**
 * Upload a base64 data-URI image (from file picker or whiteboard canvas)
 * to Cloudinary. Returns { url, publicId }.
 */
export const uploadDataImage = async (dataUri, folder = "finbridge-blogs") => {
  ensureConfigured();

  if (typeof dataUri !== "string" || !dataUri.startsWith("data:")) {
    throw new ApiError(400, "Image must be a base64 data URI");
  }
  const mime = dataUri.slice(5, dataUri.indexOf(";"));
  if (!ALLOWED_TYPES.includes(mime)) {
    throw new ApiError(400, "Only PNG, JPEG, WEBP or GIF images are allowed");
  }
  const approxBytes = Math.floor((dataUri.length - dataUri.indexOf(",") - 1) * 0.75);
  if (approxBytes > MAX_IMAGE_BYTES) {
    throw new ApiError(400, "Image must be 5MB or smaller");
  }

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (e) {
    throw new ApiError(502, `Cloudinary upload failed: ${e.message || "unknown error"}`);
  }
};

export const deleteImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // best effort — orphan images do not break the app
  }
};
