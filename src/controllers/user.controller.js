
import {asyncHandler} from "../util/asyncHandler.js";
import {ApiError} from "../util/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadResult } from "../util/cloudnary.js";
import { ApiResponse } from "../util/ApiResponse.js";


const generateAccessAndRefreshTokens=async(userId)=>
    {
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()
        user.refreshToken=refreshToken;

        await user.save({
        validateBeforeSave:false //sidha db pr dalde no validation for it
       })
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh and access token")
    }
}

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

const loginUser= asyncHandler(async(req,res)=>{
    //req body se data labe parye
    // check for username or email
    // find the user in the db
    // check password
    //access and referesh token generate karbe aur user ko bhejbe
    //send cookie- kahe ki cookioe mai he token send hoiye aur user ko assign hoiye

    const {username,email,password}=req.body;

    if(!username || !email){
        throw new ApiError(400,"username or email is required");
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user doesnot exist")
    }

    const isPasswordVlid=await user.isPasswordCorrect(password)
    if(!isPasswordVlid){
        throw new ApiError(401,"password is not correct")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);

    const loggedInUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options={
        httpOnly:true,
        secure:true,
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "user logged in successfully"
        )
    )
})
    const logoutUser=asyncHandler(async(req,res)=>{
        User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },
            {
                new: true
            }
        ) 
        const options={
        httpOnly:true,
        secure:true,
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"user logged out successfully")
    )
        
    })




export { 
    registerUser,
    loginUser,
    logoutUser
 }