import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId,
    } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    // 🔍 Filter object
    const filter = {
        isPublished: true,
    };

    // Search by title or description
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ];
    }

    // Filter by user
    if (userId) {
        filter.owner = userId;
    }

    // 🔃 Sort object
    const sortOptions = {
        [sortBy]: sortType === "asc" ? 1 : -1,
    };

    // 📊 Aggregation
    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .populate("owner", "username avatar")
        .lean();

    const totalVideos = await Video.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    totalVideos,
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalVideos / pageSize),
                    pageSize,
                },
            },
            "Videos fetched successfully"
        )
    );
});

// const publishVideo = asyncHandler(async (req, res) => {
//     const { title, description } = req.body;

//     if (!title || !description) {
//         throw new ApiError(400, "Please fill the title and description");
//     }

//     const videoLocalPath = req.files?.videoFile?.[0]?.path;
//     const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

//     if (!videoLocalPath || !thumbnailLocalPath) {
//         throw new ApiError(400, "Please upload both video and thumbnail");
//     }

//     //  Create DB record FIRST
//     const video = await Video.create({
//         title,
//         description,
//         owner: req.user._id,
//     });

//     let uploadedVideo;
//     let uploadedThumb;

//     try {
//
//         uploadedVideo = await uploadOnCloudinary({
//             localFilePath: videoLocalPath,
//             folder: "vstream/videos",
//             publicId: `video_${video._id}`,
//             resourceType: "video",
//         });

//
//         uploadedThumb = await uploadOnCloudinary({
//             localFilePath: thumbnailLocalPath,
//             folder: "vstream/thumbnails",
//             publicId: `video_${video._id}`,
//         });

//         if (!uploadedVideo || !uploadedThumb) {
//             throw new Error("Cloudinary upload failed");
//         }

//
//         const hlsUrl = cloudinary.url(uploadedVideo.public_id, {
//             resource_type: "video",
//             streaming_profile: "auto", // sp_auto
//             format: "m3u8",
//         });

//
//         video.videoFile = {
//             url: hlsUrl,
//             public_id: uploadedVideo.public_id,
//         };

//         video.thumbnail = {
//             url: uploadedThumb.url,
//             public_id: uploadedThumb.public_id,
//         };

//         await video.save();

//         return res
//             .status(201)
//             .json(new ApiResponse(201, video, "Video published successfully"));
//     } catch (error) {
//
//         await Video.findByIdAndDelete(video._id);

//         if (uploadedVideo?.public_id) {
//             await cloudinary.uploader.destroy(uploadedVideo.public_id, {
//                 resource_type: "video",
//             });
//         }

//         if (uploadedThumb?.public_id) {
//             await cloudinary.uploader.destroy(uploadedThumb.public_id);
//         }

//         throw new ApiError(500, "Video upload failed. Please try again.");
//     }
// });

const publishVideo = asyncHandler(async (req, res) => {
    // 1️⃣ Get title and description from body
    const { title, description } = req.body;
    if (!title || !description) {
        throw new ApiError(400, "Please fill the title and description");
    }
    // 2️⃣ Parse video and thumbnail data (sent as JSON strings from frontend)
    let videoData, thumbnailData;

    try {
        videoData = JSON.parse(req.body.videoFile);
        thumbnailData = JSON.parse(req.body.thumbnail);
    } catch (error) {
        throw new ApiError(400, "Invalid video or thumbnail data format");
    }
    if (!videoData || !thumbnailData) {
        throw new ApiError(400, "Please provide both video and thumbnail data");
    }
    // 3️⃣ Create DB record directly
    // We trust the frontend provided URLs from ImageKit
    const video = await Video.create({
        title,
        description,
        videoFile: {
            url: videoData.url,
            public_id: videoData.public_id,
        },
        thumbnail: {
            url: thumbnailData.url,
            public_id: thumbnailData.public_id,
        },
        owner: req.user._id,
        duration: videoData.duration || 0, // Using the duration sent from frontend
        isPublished: true,
    });
    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
    console.log(req.params);

    if (!videoId) {
        throw new ApiError(400, "Video id required");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId)
        .populate("owner", "username avatar")
        .lean();

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!video.isPublished) {
        throw new ApiError(403, "Video is not published");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(400, "Video id required");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findByIdAndDelete(videoId);
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(400, "Video id required");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    // Find Video mark its status unpublish/publish by toggling

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    //  check is it video owner or not
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video");
    }

    video.isPublished = !video.isPublished;

    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: video.isPublished },
                `Video ${
                    video.isPublished ? "published" : "unpublished"
                } successfully`
            )
        );
});

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
