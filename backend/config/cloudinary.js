const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const uploadOnCloudinary = async (buffer) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "bitenow-items" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );

        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

module.exports = uploadOnCloudinary;
