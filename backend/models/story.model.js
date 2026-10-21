import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mediaUrl: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ["image", "video"],
        default: "image"
    },
    publicId: {
        type: String,
        required: true
    },
    originalMediaUrl: {
        type: String,
        default: ""
    },
    style: {
        type: String,
        default: ""
    },
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    music: {
        trackName: { type: String, default: "" },
        artistName: { type: String, default: "" },
        previewUrl: { type: String, default: "" },
        artworkUrl: { type: String, default: "" }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Automatically removed from MongoDB after 24 hours (86400 seconds)
    }
});

// Compound index for fast queries of active stories within 24 hours
storySchema.index({ author: 1, createdAt: -1 });

export const Story = mongoose.model("Story", storySchema);
export default Story;
