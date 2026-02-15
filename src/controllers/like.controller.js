import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Generic function to handle liking and unliking for different resource types.
 */
const toggleLike = async (req, res, model, resourceIdName, resourceType) => {
    const resourceId = req.params[resourceIdName];
    const userId = req.user._id;

    if (!isValidObjectId(resourceId)) {
        throw new ApiError(400, `Invalid ${resourceType} ID`);
    }

    // 1. Check if the resource exists
    const resource = await model.findById(resourceId);
    if (!resource) {
        throw new ApiError(404, `${resourceType} not found`);
    }

    // 2. Prepare the query based on resource type
    const query = {
        likedBy: userId,
        [resourceType]: resourceId,
    };

    // 3. Check if already liked
    const alreadyLiked = await Like.findOne(query);

    if (alreadyLiked) {
        // 4. Unlike (Delete the like)
        await Like.findByIdAndDelete(alreadyLiked._id);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isLiked: false },
                    `${resourceType} unliked successfully`
                )
            );
    } else {
        // 5. Like (Create a new like)
        await Like.create(query);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isLiked: true },
                    `${resourceType} liked successfully`
                )
            );
    }
};

const toggleVideoLike = asyncHandler(async (req, res) => {
    await toggleLike(req, res, Video, "videoId", "video");
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    await toggleLike(req, res, Comment, "commentId", "comment");
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    await toggleLike(req, res, Tweet, "tweetId", "tweet");
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Aggregation pipeline to get liked videos
    const likedVideosAggregate = Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true, $ne: null }, // Filter for video likes
            },
        },
        // Sort by the 'Like' creation date (most recent like first)
        {
            $sort: {
                createdAt: -1,
            },
        },
        // Lookup the video details
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        // Match only published videos
                        $match: { isPublished: true },
                    },
                    // Lookup the video owner details
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                { $project: { username: 1, avatar: 1 } },
                            ],
                        },
                    },
                    {
                        $unwind: "$owner",
                    },
                    {
                        $project: {
                            _id: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1,
                            owner: 1,
                        },
                    },
                ],
            },
        },
        {
            // Only keep documents where videoDetails populated successfully (i.e. video is published)
            $match: {
                videoDetails: { $exists: true, $not: { $size: 0 } },
            },
        },
        {
            $unwind: "$videoDetails",
        },
        // Replace root to return the video details directly
        {
            $replaceRoot: { newRoot: "$videoDetails" },
        },
    ]);

    // Since the Like model does not use the aggregatePaginate plugin, we implement manual pagination.
    const likedVideos = await likedVideosAggregate
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

    // Total count for pagination metadata
    const totalCountResult = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true, $ne: null },
            },
        },
        {
            $count: "totalDocuments",
        },
    ]);

    const totalLikedVideos = totalCountResult[0]?.totalDocuments || 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos: likedVideos,
                pagination: {
                    totalLikedVideos,
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalLikedVideos / limitNumber),
                    pageSize: limitNumber,
                },
            },
            "Liked videos fetched successfully"
        )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
