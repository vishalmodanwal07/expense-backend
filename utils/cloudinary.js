import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

console.log(process.env.CLOUDINARY_API_KEY);

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        //upload the file on cloudinary

        const response =  await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto"
        });

        console.log(response);

        //file uploaded
        console.log("file uploaded" , response.url);
        return response;

    } catch (error) {
       console.error("Error during Cloudinary upload:", error);

        // Check if the file exists before attempting to delete it
        if (fs.existsSync(localFilePath)) {
            try {
                await fs.promises.unlink(localFilePath); // Asynchronous file deletion
            } catch (unlinkError) {
                console.error("Error deleting the local file:", unlinkError);
            }
        } else {
            console.error("File not found:", localFilePath);
        }

        return null; // Return null to indicate failure
    }
}

export {uploadOnCloudinary}
