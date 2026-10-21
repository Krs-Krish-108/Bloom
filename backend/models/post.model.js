import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    caption: {
        type: String,
        default: ""
    },
    // Single image fallback for backward compatibility
    image: {
        type: String,
        default: ""
    },
    // Original unedited photo for Admin "View Original" feature
    originalImage: {
        type: String,
        default: ""
    },
    // Multi-media carousel: up to 10 photos and/or videos
    media: [{
        url: {
            type: String,
            required: true
        },
        originalUrl: {
            type: String,
            default: ""
        },
        mediaType: {
            type: String,
            enum: ["image", "video"],
            default: "image"
        },
        style: {
            type: String,
            default: ""
        },
        publicId: {
            type: String
        }
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    isAiLabel: {
        type: Boolean,
        default: false
    },
    isBirthdayTag: {
        type: Boolean,
        default: false
    },
    style: {
        type: String,
        default: ""
    },
    cropRatio: {
        type: String,
        default: "1:1"
    }
}, { timestamps: true });

export const Post = mongoose.model("Post", postSchema);
export default Post;
