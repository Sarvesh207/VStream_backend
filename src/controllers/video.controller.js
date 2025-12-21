import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// const getAllVideos = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//     //TODO: get all videos based on query, sort, pagination
// });

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

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
    if (!title || !description) {
        throw new ApiError(400, "Please fill the title and description");
    }

    // get video file and video thumbnail

    let videoLocalPath = req.files?.videoFile?.[0]?.path;
    let thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    console.log(req.body, req.files);

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Please upload both video and thumbnail");
    }

    const videoUpload = await uploadOnCloudinary(videoLocalPath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
    console.log(videoUpload, thumbnailUpload);

    if (!videoUpload && !thumbnailUpload) {
        throw new ApiError(400, "Failed to upload video or thumbnail");
    }

    const video = await Video.create({
        title: title,
        description: description,
        thumbnail: thumbnailUpload.url,
        videoFile: videoUpload.url,
        duration: videoUpload.duration ?? 0,
        views: 0,
        isPublished: true,
        user: req.user?._id,
    });

    if (!video) {
        throw new ApiError(500, "Something went wrong while creating video");
    }

    // 201 success
    return res
        .status(201)
        .json(new ApiResponse(200, video, "Video Publish successfully"));
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
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
