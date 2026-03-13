import { Router } from "express";
import {
    deleteVideo,
    getAllVideos,
    getVideosByUser,
    getVideoById,
    publishVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js";
import {
    verifyJWT,
    optionalVerifyJWT,
} from "../middlewares/auth.middelware.js";
import { upload } from "../middlewares/multer.middelware.js";

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

//public
router.get("/", getAllVideos);
router.get("/:videoId", optionalVerifyJWT, getVideoById);

router.post(
    "/",
    verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishVideo
);

// router
//     .route("/:videoId")
//     .get(getVideoById)
//     .delete(deleteVideo)
//     .patch(upload.single("thumbnail"), updateVideo);

// router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
router.get("/user/videos", verifyJWT, getVideosByUser);

router.delete("/:videoId", verifyJWT, deleteVideo);

router.patch("/:videoId", verifyJWT, upload.single("thumbnail"), updateVideo);

router.patch("/toggle/publish/:videoId", verifyJWT, togglePublishStatus);

export default router;
