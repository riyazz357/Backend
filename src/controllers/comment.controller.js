import mongoose, { mongo } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const pageNumber=parseInt(page)
    const limitNumber=parseInt(limit)
    const skipAmount = (pageNumber - 1) * limitNumber

    const comments=await Comment.aggregate(
    [
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerInfo",
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
            $unwind:"$ownerderails"
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
        }
    ]
    );
    const totalComments = await Comment.countDocuments({
        video: new mongoose.Types.ObjectId(videoId)
    });

    if (!comments?.length) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, {
                    comments: [],
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalComments / limitNumber),
                    totalCount: totalComments
                }, "No comments found for this video")
            );
    }
    
    // 5. Return the final success response
    return res
        .status(200)
        .json(
            new ApiResponse(200, {
                comments,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalComments / limitNumber),
                totalCount: totalComments
            }, "Comments fetched successfully")
        );


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId}=req.params
    const {content}=req.body

    if(!mongoose.Aggregate.isValidObjectId(videoId)|| !content?.trim()){
        throw new ApiError(400,"Invalid video or comment content is missing")
    }

    const newComment= await Comment.create({
        content,
        video:videoId,
        owner:req.user._id
    })

    if(!newComment){
        throw new ApiError(500,"Failed to create comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(201,newComment,"comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}=req.params
    const {content}=req.body

    //validate comment id and content
    if(!mongoose.isValidObjectId(commentId)|| !content?.trim()){
        throw new ApiError(404,"comment content is missing")
    }


    //find the comment and check if current user is the owner
    const comment=await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    //checking the ownership to prevent unauthorized access
    if(comment.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not the owner of this comment")
    }

    //update the comment
    comment.content=content;
    await comment.save();

    //return the updated comment
    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"comment updated successfully")
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params
    const {content}=req.body

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(404,"comment id is missing")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(400,"comment not found")
     }

    if(comment.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not the owner of this comment")
    }
    //delete the comment
    await Comment.findByIdAndDelete(commentId);

    return res
    .status(200)
    .json(
        new ApiResponse(200,null,"comment deleted successfully")
    )


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }