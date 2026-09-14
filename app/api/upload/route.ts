import { NextRequest, NextResponse } from 'next/server';
import { isCloudinaryConfigured, uploadImageToCloudinary } from '@/lib/cloudinary';

export async function GET() {
  const configured = isCloudinaryConfigured();
  return NextResponse.json({
    service: 'cloudinary',
    configured,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
  });
}

export async function POST(req: NextRequest) {
  try {
    let dataUrl = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      dataUrl = body.dataUrl || body.image || '';
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = (file as File).type || 'image/jpeg';
        dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      }
    }

    if (!dataUrl) {
      return NextResponse.json(
        { error: 'No image data provided. Send JSON { dataUrl } or form-data { file }.' },
        { status: 400 }
      );
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({
        success: true,
        url: dataUrl,
        provider: 'fallback_data_url',
        warning:
          'Cloudinary is not configured. Saved as local data URL. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to upload to Cloudinary.',
      });
    }

    // Upload to Cloudinary
    const result = await uploadImageToCloudinary(dataUrl, 'tchibo_dpp');

    return NextResponse.json({
      success: true,
      url: result.url,
      provider: 'cloudinary',
      publicId: result.publicId,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to upload image to Cloudinary',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
