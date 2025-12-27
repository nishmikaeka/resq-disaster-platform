/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Add the specific hostname used by Google for user profile pictures
    formats: ["image/avif", "image/webp"],
    domains: [
      "lh3.googleusercontent.com",
      "res.cloudinary.com",
      // Add any other external image hosts you use (e.g., cloud storage, CDNs)
    ],
  },
};

export default nextConfig;
