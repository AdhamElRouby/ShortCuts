import type { UploadApiOptions, UploadApiResponse } from 'cloudinary';
import cloudinary from './cloudinary';

export function uploadBuffer(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'));
        resolve(result);
      })
      .end(buffer);
  });
}
