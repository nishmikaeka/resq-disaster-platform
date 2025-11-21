// apps/api/src/types/cloudinary.d.ts
declare module 'cloudinary' {
  export namespace v2 {
    export interface ConfigOptions {
      cloud_name: string;
      api_key: string;
      api_secret: string;
      secure?: boolean;
    }

    export interface UploadStreamOptions {
      folder?: string;
      resource_type?: 'auto' | 'image' | 'video' | 'raw';
      quality?: string | number;
      fetch_format?: string;
      public_id?: string;
      transformation?: unknown;
    }

    export interface UploadResult {
      secure_url: string;
      public_id: string;
      format: string;
      resource_type: string;
      width?: number;
      height?: number;
      bytes?: number;
      [key: string]: unknown;
    }

    export interface CloudinaryError {
      message: string;
      http_code?: number;
    }

    export interface UploadStream {
      write(buffer: Buffer): void;
      end(): void;
    }

    export const uploader: {
      upload_stream(
        options: UploadStreamOptions,
        callback: (
          error: CloudinaryError | undefined,
          result: UploadResult | undefined,
        ) => void,
      ): UploadStream;
    };

    export function config(options: ConfigOptions): void;
  }
}
