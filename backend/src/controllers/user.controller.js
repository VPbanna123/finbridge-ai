import { updateProfile, updateProfileImage } from "../services/user.service.js";
import { HTTP_STATUS } from "../utils/constants.js";

export const patchProfile = async (req, res) => {
  const user = await updateProfile(req.user.id, req.body);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Profile updated",
    user,
  });
};

export const patchProfileImage = async (req, res) => {
  const user = await updateProfileImage(req.user.id, req.body?.image);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Profile photo updated",
    user,
  });
};
