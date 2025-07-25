import { Router } from "express";

import
{ 
    changeCurrentPassword, 
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory, loginUser,
    logoutUser, 
    registerUser, 
    updateAccountDetails, 
    updateAvatar, 
    updateCoverImage 
} from "../controllers/user.controller.js";

import { upload } from "../middleware/multer.middlleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";
import { verify } from "jsonwebtoken";

const router=Router()

router.route("/register").post(
    upload.fields([   //injecting middleware
        {
        name:"avatar",
        maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secured route
router.route("/logout").post(verifyJwt,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt,changeCurrentPassword)
router.route("/current-user").get(verifyJwt,getCurrentUser)
router.route("/update-account").patch(verifyJwt,updateAccountDetails)
router.route("/avatar").patch(verifyJwt,upload.single("avatar"),updateAvatar)
router.route("/coverImage").patch(verifyJwt,upload.single("coverImage"),updateCoverImage)
router.route("/c/:username").get(verifyJwt,getUserChannelProfile)
router.route("/history").get(verifyJwt,getWatchHistory)


export default router;