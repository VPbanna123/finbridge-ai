import { User } from "../models/User.js";
import { ALLOWED_PROFILE_FIELDS } from "../utils/constants.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteImage, uploadDataImage } from "./cloudinary.service.js";

export const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const updateProfileImage = async (userId, dataUri) => {
  if (!dataUri) throw new ApiError(400, "Profile image is required");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const previousPublicId = user.profileImage?.publicId;
  const uploaded = await uploadDataImage(dataUri, "finbridge-avatars");

  user.profileImage = uploaded;
  await user.save();

  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    await deleteImage(previousPublicId);
  }

  return user.toSafeObject();
};

export const updateProfile = async (userId, body) => {
  const updates = {};
  for (const k of ALLOWED_PROFILE_FIELDS) {
    if (body[k] !== undefined) updates[k] = body[k];
  }
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid profile fields provided");
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select("-passwordHash");

  if (!user) throw new ApiError(404, "User not found");
  return user;
};
