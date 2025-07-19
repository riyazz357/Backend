import {v2 as cloud} from "cloudinary";
import fs from "fs";


cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secreT
    });

// Upload an image
     const uploadResult = async (localFilePath) => {
        try{
            if(!localFilePath) return null;
            //upload file on cloudnary
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            //file has been uploaded
            console.log("file is uploaded in cloudinary",response.url);
            return response;

        }catch(error){
            fs.unlinkSync(localFilePath) //remove the locally save temporaray file if upload fails
            return null
        }
     }


       cloudinary.v2.uploader.upload(
           'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
               public_id: 'shoes',
           }, function(error,result) {console.log(uploadResult)});