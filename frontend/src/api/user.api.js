import client from "./client";

export const patchProfile = (payload) => client.patch("/users/profile", payload);
export const updateProfilePhoto = (image) =>
  client.patch("/users/profile/photo", { image });
