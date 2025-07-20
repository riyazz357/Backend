import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middlkeware.js";
const router=Router()

router.route("/register").post(
    upload.fields([   //injecting middleware
        {name:"avatar",
        maxCount:1},
        {
            name:"coverimage",
            maxCount:1
        }
    ]),
    registerUser)

export default router;