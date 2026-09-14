import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary is not fully configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment.'
    );
  }

  if (!isConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    isConfigured = true;
  }

  return cloudinary;
}

export async function uploadImageToCloudinary(
  fileDataUriOrBase64: string,
  folder = 'tchibo_dpp'
): Promise<{ url: string; publicId: string; format: string; width?: number; height?: number }> {
  const client = getCloudinary();

  const uploadResult = await client.uploader.upload(fileDataUriOrBase64, {
    folder,
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  return {
    url: uploadResult.secure_url || uploadResult.url,
    publicId: uploadResult.public_id,
    format: uploadResult.format,
    width: uploadResult.width,
    height: uploadResult.height
  };
}
