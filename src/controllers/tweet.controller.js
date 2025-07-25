import mongoose, { isValidObjectId } from "mongoose"
import {tweet, tweet, Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body

    if(!content?.trim()){
        throw new ApiError(400, "Tweet content is required")
    }

    const owner=req.user._id
    const tweet=await tweet.create({
        content,
        owner,
    })
    if(!tweet){
        throw new ApiError(500,"failed to create a tweet")
    }

    return res
    .status(201)
    .json(ApiResponse(201,tweet,"Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {User}=req.user._id
    const {page=1,limit=10}=req.query

    if(!mongoose.isValidObjectId(User)){
        throw new ApiError(400, "Invalid user id")
    }
    const pageNumber=parseInt(page)
    const limitNumber=parseInt(limit)
    const skip=(pageNumber-1)*limitNumber

    const tweets= await tweet.aggregate(
        [
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(User)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owenrDetails",
                    pipeline:[
                        {
                            $project:{
                                username:1,
                                fullname:1,
                                avatar:1
                            }
                        }

                    ]
                }
                
            },
            {
                    $unwind:"$ownerDetails"
            },
            {
                $sort:{
                    createdAt:-1
                }
            },
            {
                $skip:skipAmount
            },
            {
                $limit:limitNumber
            },
            {
                $project:{
                    content:1,
                    createdAt:1,
                    updatedAt:1,
                    ownerDetails:1
                }
            }

        ]
    )
     const totalTweets = await Tweet.countDocuments({ owner: userId });

    // 5. Return response
    if (!tweets?.length) {
        return res
            .status(200)
            .json(new ApiResponse(200, {
                tweets: [],
                currentPage: pageNumber,
                totalPages: Math.ceil(totalTweets / limitNumber),
                totalCount: totalTweets
            }, "No tweets found for this user"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {
            tweets,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalTweets / limitNumber),
            totalCount: totalTweets
        }, "User tweets fetched successfully"));

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params
    const {content}=req.body
    const {_id:userId }= req.user.id;

    if(!isValidObjectId(tweetId)){
        throw new Error('Invalid tweet id')
    }

    if(!content?.trim()){
        throw new Error('Content is required')
    }
    const tweet=await tweet.findById(tweetId)
    if(!tweet){
        throw new Error('Tweet not found')
    }
    if(tweet.owner.toString() !== userId){
        throw new ApiError(403,"you are not authorized to tweet")
    }
    tweet.content=content

    await tweet.save({validateBeforeSave:true});
    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params
    const {_id:userId }= req.user.id;
    const {content}=req.body
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}