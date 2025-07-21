// In src/util/cloudnary.js

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary with your credentials (usually from environment variables)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadResult = async (localFilePath) => {
    // Check if a local file path was provided
    if (!localFilePath) return null;

    try {
        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" // Automatically detect the file type
        });

        // File has been uploaded successfully
        console.log("File uploaded successfully to Cloudinary:", response.url);
        
        // Unlink (delete) the locally saved temporary file
        fs.unlinkSync(localFilePath); 
        
        return response;

    } catch (error) {
        // An error occurred during the upload
        console.error("Cloudinary upload failed. Error:", error);

        // Remove the locally saved temporary file as the upload operation failed
        fs.unlinkSync(localFilePath); 
        
        return null; // Return null to indicate failure
    }
};

export { uploadResult };