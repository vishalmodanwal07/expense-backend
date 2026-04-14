import { uploadOnCloudinary } from "../../utils/cloudinary.js";


export const uploadRecipt = async (req , res) => {
console.log(req.file);
 const localFilepath = req.file?.path;
 const response = await uploadOnCloudinary(localFilepath);
 return res
      .status(201)
      .json({
        imageUrl : response.secure_url 
       });
} 