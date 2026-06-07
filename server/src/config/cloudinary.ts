import { v2 as cloudinary } from "cloudinary";
import { config } from "./env";

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

export const uploadToCloudinary = async (
  filePath: string,
  folder: string = "snapconnect"
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto",
  });
  return { url: result.secure_url, publicId: result.public_id };
};

export const deleteFromCloudinary = async (publicId: string) => {
  await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
