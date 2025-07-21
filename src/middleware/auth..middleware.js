import { ApiError } from "../util/ApiError"
import { asyncHandler } from "../util/asyncHandler"
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const verifyJwt=asyncHandler(async(req,res,next)=>{
    try{
        const token=req.cookies?.accessToken || req.header("Auhtorization").replace("Bearer ","")

    if(!token){
        throw new ApiError(401,"unauthorized request");
    }
    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

    const user=await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
    )

    if(!user){
        throw new ApiError(401,"Invalid accessToken")
    }
    req.user=user;
    next();
    } catch(error){
        throw new ApiError(401,error?.message || "Invalid acess token")
    }

})




/*

import { ApiError } from "../util/ApiError" // Imports a custom error class for consistent API error responses.
import { asyncHandler } from "../util/asyncHandler" // Imports a utility to wrap async middleware functions, catching errors and passing them to Express's error handler.
import jwt from "jsonwebtoken"; // Imports the jsonwebtoken library for working with JWTs (verifying them).
import { User } from "../models/user.model"; // Imports the Mongoose User model to query user data from the database.

// Exports the verifyJwt function, wrapped by asyncHandler to handle promises and errors.
export const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        // Tries to get the token:
        // 1. First, it looks for an 'accessToken' in the request's cookies (req.cookies?.accessToken).
        // 2. If not found in cookies, it looks for the 'Authorization' header.
        // 3. If found in the header, it removes the "Bearer " prefix to get just the token string.
        const token = req.cookies?.accessToken || req.header("Auhtorization").replace("Bearer ", "");

        // Checks if a token was successfully extracted from either cookies or header.
        if (!token) {
            // If no token is found, it throws an ApiError, indicating an unauthorized request.
            throw new ApiError(401, "unauthorized request");
        }

        // Verifies the extracted token:
        // It uses jwt.verify() to decode the token using the ACCESS_TOKEN_SECRET environment variable.
        // This process also checks if the token is expired or tampered with.
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Finds the user in the database based on the _id extracted from the decoded token.
        // It uses .select("-password -refreshToken") to exclude sensitive fields from the returned user object.
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        // Checks if a user was found in the database with the decoded token's _id.
        if (!user) {
            // If no user is found (meaning the _id in the token doesn't correspond to an existing user),
            // it throws an ApiError indicating an invalid access token.
            throw new new ApiError(401, "Invalid accessToken");
        }

        // If the token is valid and a user is found, the user object is attached to the request object.
        // This makes the user's data (excluding password/refreshToken) available to subsequent middleware or route handlers.
        req.user = user;

        // Calls the next middleware or the actual route handler in the Express chain.
        next();
    } catch (error) {
        // Catches any errors that occur during the try block (e.g., token verification failure, database errors).
        // Throws a new ApiError with a 401 status, using the original error's message or a default "Invalid access token" message.
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
*/