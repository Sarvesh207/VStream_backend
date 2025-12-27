import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async ({
  localFilePath,
  folder,
  publicId = null,
  resourceType = "auto",
  overwrite = false,
}) => {
  try {
    if (!localFilePath) return null;

    const options = {
      resource_type: resourceType,
      folder,
      overwrite,
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const response = await cloudinary.uploader.upload(
      localFilePath,
      options
    );

    fs.unlinkSync(localFilePath); // cleanup temp file

    return {
      url: response.secure_url,
      public_id: response.public_id,
      resource_type: response.resource_type,
      duration: response.duration,
    };
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error;
  }
};

export { uploadOnCloudinary };
