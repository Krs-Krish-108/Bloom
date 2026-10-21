import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/datauri.js";
import { Story } from "../models/story.model.js";
import { User } from "../models/user.model.js";
import {
    IMAGE_STYLE_PROMPTS,
    SUPPORTED_STYLE_KEYS,
    isValidStyle,
    getPromptForStyle
} from "../config/imageStylePrompts.js";

// Add new story (Photo with mandatory style conversion, or Video with author-only privacy)
export const addNewStory = async (req, res) => {
    try {
        const authorId = req.id;
        const { style, styledUrl, originalUrl, publicId } = req.body;

        let file = req.file;
        if (!file && req.files) {
            file = req.files.file?.[0] || req.files.media?.[0];
        }

        const user = await User.findById(authorId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        let isVideo = false;
        if (file) {
            isVideo = file.mimetype.startsWith("video") || 
                      file.originalname.endsWith(".mp4") || 
                      file.originalname.endsWith(".webm") ||
                      file.originalname.endsWith(".mov");
        } else if (req.body.type === "video" || req.body.mediaType === "video") {
            isVideo = true;
        }

        let finalMediaUrl = "";
        let finalOriginalUrl = "";
        let finalPublicId = publicId || "";

        if (isVideo) {
            // Video: style conversion not required, video privacy applies (author-only)
            if (file) {
                const fileUri = getDataUri(file);
                const cloudResponse = await cloudinary.uploader.upload(fileUri, {
                    folder: "bloom_stories/videos",
                    resource_type: "video"
                });
                finalMediaUrl = cloudResponse.secure_url;
                finalOriginalUrl = cloudResponse.secure_url;
                finalPublicId = cloudResponse.public_id;
            } else if (req.body.url) {
                finalMediaUrl = req.body.url;
                finalOriginalUrl = req.body.url;
            } else {
                return res.status(400).json({
                    message: "Video file is required for video story",
                    success: false
                });
            }
        } else {
            // Image: Mandatory AI style conversion!
            const normalizedStyle = (style || "").trim().toLowerCase();
            if (!isValidStyle(normalizedStyle)) {
                return res.status(400).json({
                    message: `Image style conversion is mandatory for stories. Supported styles: ${SUPPORTED_STYLE_KEYS.join(", ")}`,
                    success: false
                });
            }

            // If already converted via style transformation on frontend:
            if (styledUrl && styledUrl.startsWith("http")) {
                finalMediaUrl = styledUrl;
                if (originalUrl && originalUrl.startsWith("http")) {
                    finalOriginalUrl = originalUrl;
                } else if (file) {
                    const fileUri = getDataUri(file);
                    const originalUpload = await cloudinary.uploader.upload(fileUri, {
                        folder: "bloom_stories/originals",
                        resource_type: "image"
                    });
                    finalOriginalUrl = originalUpload.secure_url;
                } else {
                    finalOriginalUrl = originalUrl || styledUrl;
                }
            } else if (file) {
                // Upload original image to bloom_stories/originals (stored in DB)
                const fileUri = getDataUri(file);
                const originalUpload = await cloudinary.uploader.upload(fileUri, {
                    folder: "bloom_stories/originals",
                    resource_type: "image"
                });
                finalOriginalUrl = originalUpload.secure_url;

                // Construct targeted style prompt
                let targetedPrompt = getPromptForStyle(normalizedStyle);
                if (!targetedPrompt) {
                    targetedPrompt = `Completely redraw and transform this photo into a pure animated cartoon illustration in ${getPromptForStyle(normalizedStyle) || "anime cartoon style"}. DO NOT make it realistic. Must look 100% like a cartoon animation.`;
                }

                // Generate High-Quality AI Artwork using Google Gemini
                if (process.env.GEMINI_API_KEY && file.buffer) {
                    try {
                        const parts = [
                            {
                                inlineData: {
                                    mimeType: file.mimetype || "image/jpeg",
                                    data: file.buffer.toString("base64")
                                }
                            },
                            { text: targetedPrompt }
                        ];

                        console.log(`[Gemini Story Transform] Initiating ${normalizedStyle} cartoon generation...`);
                        const geminiRes = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ contents: [{ parts }] }),
                                signal: AbortSignal.timeout(45000)
                            }
                        );

                        const geminiData = await geminiRes.json();
                        const imagePart = geminiData.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

                        if (imagePart?.inlineData?.data) {
                            const dataUri = `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`;
                            const cloudStyled = await cloudinary.uploader.upload(dataUri, {
                                folder: "bloom_stories/styled"
                            });
                            if (cloudStyled?.secure_url) {
                                finalMediaUrl = cloudStyled.secure_url;
                                finalPublicId = cloudStyled.public_id;
                                console.log(`[Gemini Story Transform] Successfully generated and uploaded pure cartoon ${normalizedStyle} story!`);
                            }
                        }
                    } catch (geminiErr) {
                        console.warn("[Gemini Story Transform Notice]:", geminiErr.message);
                    }
                }

                // Fallback to Cloudinary artistic transformation if needed
                if (!finalMediaUrl) {
                    let transformationConfig = [
                        { effect: normalizedStyle === "ghibli" ? "art:primavera" : normalizedStyle === "anime" ? "cartoonify:60:50" : "cartoonify:20:30" }
                    ];
                    const transformedUrl = cloudinary.url(originalUpload.public_id, {
                        transformation: transformationConfig,
                        secure: true
                    });
                    const cloudStyled = await cloudinary.uploader.upload(transformedUrl, {
                        folder: "bloom_stories/styled"
                    });
                    finalMediaUrl = cloudStyled.secure_url;
                    finalPublicId = cloudStyled.public_id;
                }
            } else {
                return res.status(400).json({
                    message: "Photo file or converted image URL is required",
                    success: false
                });
            }
        }

        // Save story: original is saved in DB, only converted image is displayed on story
        const newStory = await Story.create({
            author: authorId,
            mediaUrl: finalMediaUrl,
            originalMediaUrl: finalOriginalUrl,
            style: isVideo ? "" : (style || "").toLowerCase(),
            mediaType: isVideo ? "video" : "image",
            publicId: finalPublicId || "story_" + Date.now()
        });

        await newStory.populate({
            path: "author",
            select: "username profilePicture"
        });

        return res.status(201).json({
            message: `${isVideo ? "Video" : "Photo"} story published successfully`,
            success: true,
            story: newStory
        });
    } catch (error) {
        console.error("Error in addNewStory:", error);
        return res.status(500).json({
            message: "Failed to upload story",
            success: false,
            error: error.message
        });
    }
};

// Get all active stories (past 24 hours), grouped by author, with Video Privacy Rule enforced
export const getAllStories = async (req, res) => {
    try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const viewerId = req.id ? req.id.toString() : null;

        const stories = await Story.find({
            createdAt: { $gte: cutoff }
        })
        .sort({ createdAt: 1 })
        .populate({
            path: "author",
            select: "username profilePicture"
        });

        // Group stories by author & enforce Video Privacy Rule
        const storiesByUserMap = new Map();

        for (const story of stories) {
            if (!story.author) continue;
            const authorId = story.author._id.toString();
            const isOwner = viewerId && viewerId === authorId;
            const isAdmin = Boolean(req.isAdmin);

            // Video Privacy Rule:
            // The author and Admin can see videos, but other users can ONLY view images, not videos!
            if (story.mediaType === "video" && !isOwner && !isAdmin) {
                continue;
            }

            if (!storiesByUserMap.has(authorId)) {
                storiesByUserMap.set(authorId, {
                    userId: authorId,
                    username: story.author.username,
                    avatar: story.author.profilePicture,
                    timestamp: story.createdAt,
                    stories: []
                });
            }

            const userGroup = storiesByUserMap.get(authorId);
            userGroup.timestamp = story.createdAt; // latest timestamp
            userGroup.stories.push({
                id: story._id.toString(),
                type: story.mediaType,
                src: story.mediaUrl, // Converted art form is shown on story
                originalSrc: story.originalMediaUrl || story.mediaUrl, // Original photo for Admin
                style: story.style || "",
                createdAt: story.createdAt
            });
        }

        const groupedStories = Array.from(storiesByUserMap.values());

        return res.status(200).json({
            success: true,
            groupedStories
        });
    } catch (error) {
        console.error("Error in getAllStories:", error);
        return res.status(500).json({
            message: "Failed to fetch stories",
            success: false,
            error: error.message
        });
    }
};

// Delete story by ID (Cloudinary asset removal + DB cleanup)
export const deleteStory = async (req, res) => {
    try {
        const storyId = req.params.id;
        const authorId = req.id;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                message: "Story not found",
                success: false
            });
        }

        // Owner or Admin is authorized to delete the story
        const isAdmin = Boolean(req.isAdmin);
        if (story.author.toString() !== authorId.toString() && !isAdmin) {
            return res.status(403).json({
                message: "Unauthorized: You can only delete your own stories",
                success: false
            });
        }

        // Remove from Cloudinary to free up storage space
        if (story.publicId) {
            try {
                await cloudinary.uploader.destroy(story.publicId, {
                    resource_type: story.mediaType === "video" ? "video" : "image"
                });
            } catch (cloudErr) {
                console.error("Cloudinary asset deletion error:", cloudErr);
            }
        }

        await Story.findByIdAndDelete(storyId);

        return res.status(200).json({
            message: "Story deleted successfully from Cloudinary and database",
            success: true,
            deletedStoryId: storyId
        });
    } catch (error) {
        console.error("Error in deleteStory:", error);
        return res.status(500).json({
            message: "Failed to delete story",
            success: false,
            error: error.message
        });
    }
};
