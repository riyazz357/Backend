
import {asyncHandler} from "../util/asyncHandler.js";
import {ApiError} from "../util/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadResult } from "../util/cloudnary.js";
import { ApiResponse } from "../util/ApiResponse.js";


const registerUser=asyncHandler(async (req,res)=>{
    //get user detail from frontend
    //username,fullname,email,
    //validation :verify the registration like not empty
    //check if user already exist: username and email also 
    //check for the images and avatar
    //upload them to cloudnary ---
    //check is it upload or not
    //create user object- create entry in db
    // remove the password and refresh token field from response
    //check for user creation
    //return response

    const {username,fullname,email,password}=req.body;
    console.log("email:",email)

    if(
        [fullname,email,username,password].some((field)=>field?.trim()==="")
    )
    {
        throw new ApiError(400,"all field are required!!");
    }

    const existedUser= await User.findOne({
        $or:[{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exist");
    }
    console.log(req.files)

    const avatarLocalPath=req.files?.avatar[0]?.path;
    //const coverImageLocalPath= req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }


    const avatar=await uploadResult(avatarLocalPath)
    const coverImage=await uploadResult(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is not uploaded");
    }
  
    const user=await User.create({
        username:username.toLowerCase(),
        fullname,
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken" // remove password and refresh token from response

    ); //checking user is created or not 


    if(!createdUser){
        throw new ApiError(500,"User creation failed ");
    }

    return res.status(201).json(
    new ApiResponse(200,createdUser,"user registered successfully..."))

    // if(fullname===""){
    //     throw new ApiError(400,"fullname required!!!");

    // }
})

export { registerUser }