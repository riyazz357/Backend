
import {asyncHandler} from "../util/asyncHandler.js";
import {ApiError} from "../util/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadResult } from "../util/cloudnary.js";
import { ApiResponse } from "../util/ApiResponse.js";
import jwt from "jsonwebtoken";
import { JsonWebTokenError } from "jsonwebtoken";
import mongoose from "mongoose";


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

    if((!username && !email)){
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
                $unset:{
                    refreshToken:1 //remove the field from the document
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

    // refresh token code 
    const refreshAccessToken=asyncHandler(async(req,res)=>{
        const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

        if(!incomingRefreshToken){
            throw new ApiError(401,"unauhtorized request")
        }
        try {
            const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET)

            const user=await User.findById(decodedToken?._id)
             if(!user){
                throw new ApiError(401,"invalid token")
        }

        if(incomingRefreshToken !==user?.refreshToken){
            throw new ApiError(401,"refresh token is expire")
        }

        const options={
            httpOnly:true,
            secure:true,
        }

        const{accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refresh successfully"
            )
        )
            
        } catch (error) {
            throw new ApiError(401,error?.message || "invalid token ")
            
        }
    })


    // upadting the passwwword
    const changeCurrentPassword=asyncHandler(async(req,res)=>{
        const {oldPassword,newPassword}=req.body //field to taken from req.body
        const user=await User.findById(req.user?._id)

        const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
        if(!isPasswordCorrect){
            throw new ApiError(401,"old password is incorrect")
        }

        user.password=newPassword
        await user.save({validateBeforeSave:false})

        return res
        .status(200)
        .json(new ApiResponse(200,{},"password changed successfully"))
    })


    const getCurrentUser=asyncHandler(async(req,res)=>{
        return res
        .status(200)
        .json((200,req.user,"current user fetched successfully"))
    })

    //updating the user details
    const updateAccountDetails=asyncHandler(async(req,res)=>{
        const {fullname,email}=req.body

        if(!fullname || !email){
            throw new ApiError(400,"All fields are required")
        }
        const user=await User.findByIdAndUpdate(req.user?._id,{
            $set:{ //momgose operator
                fullname,email
            }
        },{new:true}).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Account details updated successfully"))
    })

const updateAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }
    const avatar=await uploadResult(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"error while uploading")
    }
    const user =await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
                 }

        },
        {new:true}).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(200,user,"avatar updated successfully")
        )

})
const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPathLocalPath=req.file?.path
    if(!coverImageLocalPathLocalPathLocalPath){
        throw new ApiError(400,"cover file is missing")
    }
    const coverImage=await uploadResult(coverImageLocalPathLocalPathLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"error while uploading")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
                 }

        },
        {new:true}).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(200,user,"coveImage updated successfully")
        )

})


//using aggregation pipeline
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }
    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{   //count the number of subscriber
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{    //count the number i have subcribed to 
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscriberedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers",
                },
                channelsSubscribedCount:{
                    $size:"$subscriberedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscriberCount:1,
                channelsSubscribedCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel doesn't exist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched successfully")
    )

     

})
    
const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }

        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1,
                                    }
                                },
                                
                            ]

                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched!!!"


    ))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,

 }