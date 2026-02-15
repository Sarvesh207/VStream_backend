import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user?._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId.toString() === subscriberId.toString()) {
        throw new ApiError(400, "Cannot subscribe to your own channel");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    let isSubscribed;
    let operation;

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);
        isSubscribed = false;
        operation = "Unsubscribed";
    } else {
        await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });
        isSubscribed = true;
        operation = "Subscribed";
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: isSubscribed },
                `${operation} successfully`
            )
        );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params; // Route passes subscriberId, but this is the channelId

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscriber",
        },
        {
            $project: {
                subscriber: 1,
                _id: 0,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers.map((s) => s.subscriber),
            "Subscribers fetched successfully"
        )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // The route is secured by verifyJWT, so we use the authenticated user's ID.
    const subscriberId = req.user?._id;

    if (!isValidObjectId(subscriberId)) {
        // This should not happen if verifyJWT works correctly, but as a safeguard:
        throw new ApiError(400, "Invalid Subscriber ID");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscribedChannel",
        },
        {
            $project: {
                subscribedChannel: 1,
                _id: 0,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribedChannels.map((s) => s.subscribedChannel),
            "Subscribed channels fetched successfully"
        )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
