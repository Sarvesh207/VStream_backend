import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Pipeline to fetch comments with owner details
    const commentsAggregate = Comment.aggregate([
        {
            // Stage 1: Filter comments by videoId
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            // Stage 2: Populate the owner details
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        // Sub-pipeline: Select only necessary user fields
                        $project: {
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            // Stage 3: Deconstruct the ownerDetails array
            $unwind: "$ownerDetails",
        },
        {
            // Stage 4: Sort by newest comments first
            $sort: {
                createdAt: -1,
            },
        },
        {
            // Stage 5: Final projection to shape the output
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: "$ownerDetails",
            },
        },
    ]);

    const options = {
        page: pageNumber,
        limit: limitNumber,
    };

    const result = await Comment.aggregatePaginate(commentsAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const owner = req.user._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    // Check if the video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: owner,
    });

    if (!comment) {
        throw new ApiError(500, "Failed to add comment. Please try again.");
    }

    // Populate owner details for immediate response
    const createdComment = await Comment.findById(comment._id).populate(
        "owner",
        "username avatar"
    );

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdComment, "Comment added successfully")
        );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required for update");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Authorization check: Only the owner can update their comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this comment"
        );
    }

    comment.content = content.trim();
    // Use findByIdAndUpdate for simplicity and atomicity, ensuring content is not empty
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content.trim(),
            },
        },
        { new: true } // Return the updated document
    ).populate("owner", "username avatar");

    if (!updatedComment) {
        // This should not happen if the comment was found, but for safety:
        throw new ApiError(500, "Failed to update comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Authorization check: Only the owner can delete their comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this comment"
        );
    }

    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
