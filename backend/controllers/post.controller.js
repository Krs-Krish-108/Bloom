import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/datauri.js";
import {Post} from "../models/post.model.js";
import {User} from "../models/user.model.js";
import Comment from "../models/comments.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import {
    IMAGE_STYLE_PROMPTS,
    SUPPORTED_STYLE_KEYS,
    isValidStyle,
    getPromptForStyle
} from "../config/imageStylePrompts.js";

export const addnewPost = async (req, res) => {
    try {
        const { caption, isBirthdayTag, style, cropRatio, mediaDetails } = req.body;
        const authorId = req.id;

        const user = await User.findById(authorId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        let uploadedMedia = [];
        if (mediaDetails) {
            try {
                uploadedMedia = typeof mediaDetails === "string" ? JSON.parse(mediaDetails) : mediaDetails;
            } catch {
                uploadedMedia = [];
            }
        }

        // Mandatory AI Image Style Verification:
        // Every image in mediaDetails must have a validated style key and a converted URL
        for (const item of uploadedMedia) {
            const isVideo = item.mediaType === "video";
            if (!isVideo) {
                const styleKey = (item.style || "").trim().toLowerCase();
                if (!isValidStyle(styleKey)) {
                    return res.status(400).json({
                        message: `Image style conversion is mandatory. "${item.style || "Unstyled"}" is not a supported style. Supported styles: ${SUPPORTED_STYLE_KEYS.join(", ")}`,
                        success: false
                    });
                }
                if (!item.url || typeof item.url !== "string" || !item.url.startsWith("http")) {
                    return res.status(400).json({
                        message: "Invalid or missing converted image URL. All images must be converted before posting.",
                        success: false
                    });
                }
            }
        }

        // Collect any uploaded video files from req.files or req.file
        let files = [];
        if (req.files) {
            if (Array.isArray(req.files)) {
                files = req.files;
            } else {
                if (req.files.media) files.push(...req.files.media);
                if (req.files.video) files.push(...req.files.video);
                // Reject direct image file uploads on /addpost (must use /transform-style first)
                if (req.files.image && req.files.image.length > 0) {
                    return res.status(400).json({
                        message: "Direct image uploads are not permitted. All photos must be converted via style selection first.",
                        success: false
                    });
                }
            }
        } else if (req.file) {
            files = [req.file];
        }

        for (const file of files) {
            const isVideo = file.mimetype.startsWith("video") ||
                            file.originalname.endsWith(".mp4") ||
                            file.originalname.endsWith(".webm") ||
                            file.originalname.endsWith(".mov");

            if (!isVideo) {
                return res.status(400).json({
                    message: "Direct image files cannot be uploaded without prior style conversion.",
                    success: false
                });
            }

            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri, {
                folder: "bloom_videos",
                resource_type: "video"
            });

            const emptySlotIndex = uploadedMedia.findIndex((m) => !m.url && m.mediaType === "video");
            if (emptySlotIndex !== -1) {
                uploadedMedia[emptySlotIndex] = {
                    url: cloudResponse.secure_url,
                    mediaType: "video",
                    style: "",
                    publicId: cloudResponse.public_id
                };
            } else {
                uploadedMedia.push({
                    url: cloudResponse.secure_url,
                    mediaType: "video",
                    style: "",
                    publicId: cloudResponse.public_id
                });
            }
        }

        // Filter and sanitize media items:
        // Ensure ONLY converted images are saved in post.media (never store original image as post image)
        uploadedMedia = uploadedMedia
            .filter((m) => m && m.url)
            .map((m) => ({
                url: m.url, // Converted image URL
                originalUrl: m.originalUrl || m.tempOriginalUrl || "", // Original unedited image URL
                mediaType: m.mediaType || "image",
                style: m.mediaType === "video" ? "" : (m.style || "").toLowerCase(),
                publicId: m.publicId || ""
            }));

        if (uploadedMedia.length === 0) {
            return res.status(400).json({
                message: "At least one converted photo or video is required to create a post.",
                success: false
            });
        }

        if (uploadedMedia.length > 10) {
            return res.status(400).json({
                message: "You can upload a maximum of 10 items in a single post",
                success: false
            });
        }

        // Save post with converted image(s) and original image URL for Admin View Original
        const newPost = await Post.create({
            caption: caption || "",
            image: uploadedMedia[0]?.url || "",
            originalImage: uploadedMedia[0]?.originalUrl || "",
            media: uploadedMedia,
            isAiLabel: true, // Always true since image style conversion is mandatory
            isBirthdayTag: isBirthdayTag === "true" || isBirthdayTag === true,
            style: style || uploadedMedia[0]?.style || "",
            cropRatio: cropRatio || "1:1",
            author: authorId
        });

        user.posts.push(newPost._id);
        await user.save();

        await newPost.populate({ path: "author", select: "-password" });

        return res.status(201).json({
            message: "Post created successfully",
            success: true,
            post: newPost
        });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 })
            .populate({ path: "author", select: "username profilePicture" })
            .populate({
                path: "comments",
                sort: { createdAt: -1 },
                populate: {
                    path: "author",
                    select: "username profilePicture"
                }
            });

        // Video Privacy Rule: Videos are visible to author and Admin!
        const viewerId = req.id ? req.id.toString() : null;
        const isAdmin = Boolean(req.isAdmin);

        const sanitizedPosts = posts.map((post) => {
            const p = post.toObject();
            const authorId = p.author?._id?.toString() || p.author?.toString();
            if (!isAdmin && viewerId !== authorId) {
                // Non-authors and non-admins only see converted images, no original photos!
                p.originalImage = "";
                p.media = (p.media || [])
                    .filter((m) => m.mediaType === "image")
                    .map((m) => ({
                        ...m,
                        originalUrl: ""
                    }));
            }
            return p;
        });

        return res.status(200).json({
            message: "Posts fetched successfully",
            success: true,
            posts: sanitizedPosts
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const userkisariposts = async (req, res) => {
    try {
        const authorId = req.id;
        const user = await User.findById(authorId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        const posts = await Post.find({ author: authorId })
            .sort({ createdAt: -1 })
            .populate({
                path: "author",
                select: "username profilePicture"
            })
            .populate({
                path: "comments",
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: "author",
                    select: "username profilePicture"
                }
            });
        return res.status(200).json({
            message: "User's posts fetched successfully",
            success: true,
            posts: posts
        });
    } catch (error) {
        console.error("Error fetching user's posts:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const likePost = async (req, res) => {
    try {
        const likekarnewalekiid = req.id;
        const postId = req.params.id || req.body.postId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found",
                success: false
            });
        }

        if (!post.likes.some(
            (id) => id.toString() === likekarnewalekiid
        )) {
            post.likes.push(likekarnewalekiid);
            await post.save();
        }


        // Implement socket.io here to notify the post author about the like
        const user = await User.findById(likekarnewalekiid).select("username profilePicture");
        const postOwnerId = post.author.toString();
        if (postOwnerId !== likekarnewalekiid) {
            const notification = {
                type: "like",
                userId: likekarnewalekiid,
                userDetails: user,
                postId,
                postMedia: (post.media && post.media.length > 0 ? post.media[0].url : post.image) || "",
                message: "liked your post.",
                createdAt: new Date().toISOString()
            };
            const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            if (postOwnerSocketId) {
                io.to(postOwnerSocketId).emit("notification", notification);
            }
        }

        // Broadcast real-time like update to all connected clients
        io.emit("postLikesUpdated", {
            postId: post._id.toString(),
            likes: post.likes
        });

        return res.status(200).json({
            message: "Post liked successfully",
            success: true,
            post: post
        });
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const unlikePost = async (req, res) => {
    try {
        const likekarnewalekiid = req.id;
        const postId = req.params.id || req.body.postId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found",
                success: false
            });
        }
        if (post.likes.some(
            (id) => id.toString() === likekarnewalekiid
        )) {
            post.likes = post.likes.filter(
                (id) => id.toString() !== likekarnewalekiid
            );
            await post.save();
        }

        // Broadcast real-time like update to all connected clients
        io.emit("postLikesUpdated", {
            postId: post._id.toString(),
            likes: post.likes
        });

        return res.status(200).json({
            message: "Post unliked successfully",
            success: true,
            post: post
        });
    } catch (error) {
        console.error("Error unliking post:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const addComment = async (req, res) => {
    try {
        const postId = req.params.id || req.body.postId;
        const comment = req.body.text || req.body.comment;
        const commentkarnewalekiid = req.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found",
                success: false
            });
        }
        if (typeof comment !== "string" || !comment.trim() ) {
            return res.status(400).json({
                message: "Comment is required",
                success: false
            });
        }

        const newComment = await Comment.create({
            text: comment,
            author: commentkarnewalekiid,
            post: postId
        });

        await newComment.populate({
            path: "author",
            select: "username profilePicture"
        });


        post.comments.push(newComment._id);
        await post.save();

        const postOwnerId = post.author.toString();
        if (postOwnerId !== commentkarnewalekiid) {
            const isReply = comment.trim().startsWith("@");
            const notification = {
                type: isReply ? "reply" : "comment",
                userId: commentkarnewalekiid,
                userDetails: newComment.author,
                postId,
                postMedia: (post.media && post.media.length > 0 ? post.media[0].url : post.image) || "",
                commentText: comment,
                message: isReply
                    ? `replied to your comment: "${comment.length > 60 ? comment.slice(0, 60) + '...' : comment}"`
                    : `commented on your post: "${comment.length > 60 ? comment.slice(0, 60) + '...' : comment}"`,
                createdAt: new Date().toISOString()
            };
            const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            if (postOwnerSocketId) {
                io.to(postOwnerSocketId).emit("notification", notification);
            }
        }

        return res.status(201).json({
            message: "Comment added successfully",
            success: true,
            comment: newComment
        });

    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const getCommentsOfPost = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({ post: postId })
            .populate({
                path: "author",
                select: "username profilePicture"
            })
            .sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Comments fetched successfully",
            success: true,
            comments: comments
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found",
                success: false
            });
        }

        const isAdmin = Boolean(req.isAdmin);
        const isAuthor = post.author.toString() === authorId;

        // Check if the logged-in user is the author or an Admin
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                message: "You are not authorized to delete this post",
                success: false
            });
        }

        // Remove the post from the author's posts array
        const postAuthorUser = await User.findById(post.author);
        if (postAuthorUser) {
            postAuthorUser.posts = postAuthorUser.posts.filter((id) => id.toString() !== postId);
            await postAuthorUser.save();
        }

        // Clean up Cloudinary assets if present
        if (post.media && post.media.length > 0) {
            for (const item of post.media) {
                if (item.publicId) {
                    try {
                        await cloudinary.uploader.destroy(item.publicId, {
                            resource_type: item.mediaType === "video" ? "video" : "image"
                        });
                    } catch (e) {
                        console.error("Cloudinary delete error:", e);
                    }
                }
            }
        }

        await Post.findByIdAndDelete(postId);

        // Delete all comments associated with the post
        await Comment.deleteMany({ post: postId });

        // Clean up any bookmarks referencing this post
        await User.updateMany({ bookmarks: postId }, { $pull: { bookmarks: postId } });

        return res.status(200).json({
            message: "Post deleted successfully",
            success: true
        });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const bookmarkPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found",
                success: false
            });
        }

        const user = await User.findById(authorId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        if (user.bookmarks.some((id) => id.toString() === postId)) {
            //aready bookkmarked, so remove it from bookmarks
            await user.updateOne({ $pull: { bookmarks: post._id } });
            return res.status(200).json({
                type: "unsaved",
                message: "Post removed from bookmarks",
                success: true
            });
        } else {
            //not bookmarked, so add it to bookmarks
            await user.updateOne({ $addToSet: { bookmarks: post._id } });
            return res.status(200).json({
                type: "saved",
                message: "Post added to bookmarks",
                success: true
            });
        }
    } catch (error) {
        console.error("Error bookmarking post:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const transformImageStyle = async (req, res) => {
    try {
        const { style, existingOriginalUrl, existingPublicId } = req.body;
        const file = req.file;

        // 1. Validate style key on the backend. Reject unsupported styles.
        const normalizedStyle = (style || "").trim().toLowerCase();
        if (!isValidStyle(normalizedStyle)) {
            return res.status(400).json({
                message: `Unsupported style: "${style}". Supported styles are: ${SUPPORTED_STYLE_KEYS.join(", ")}`,
                success: false
            });
        }

        // 2. Validate input image
        if (!file && !existingOriginalUrl && !existingPublicId) {
            return res.status(400).json({
                message: "No image provided for style transformation",
                success: false
            });
        }

        // Retrieve dedicated prompt for the style from imageStylePrompts.js
        const prompt = getPromptForStyle(normalizedStyle);

        let tempPublicId = existingPublicId;
        let tempOriginalUrl = existingOriginalUrl;

        // Upload original image to temporary folder bloom_temp (not persisted as post image)
        if (file) {
            const fileUri = getDataUri(file);
            const tempUpload = await cloudinary.uploader.upload(fileUri, {
                folder: "bloom_temp",
                resource_type: "image"
            });
            tempPublicId = tempUpload.public_id;
            tempOriginalUrl = tempUpload.secure_url;
        }

        // 3. Prepare Image Buffer for Multimodal Gemini Transformation
        let imageBuffer = file?.buffer;
        let imageMime = file?.mimetype || "image/jpeg";
        if (!imageBuffer && tempOriginalUrl) {
            try {
                const imgRes = await fetch(tempOriginalUrl);
                const arrayBuffer = await imgRes.arrayBuffer();
                imageBuffer = Buffer.from(arrayBuffer);
                imageMime = imgRes.headers.get("content-type") || "image/jpeg";
            } catch (fetchErr) {
                console.warn("Could not fetch image buffer:", fetchErr.message);
            }
        }

        // 4. Construct targeted artistic prompt for Gemini
        let targetedPrompt = getPromptForStyle(normalizedStyle);
        if (!targetedPrompt) {
            targetedPrompt = `Completely redraw and transform this photo into a pure animated cartoon illustration in ${prompt}. DO NOT make it realistic. Must look 100% like a cartoon animation.`;
        }

        // 5. Generate High-Quality Pure Cartoon AI Artwork using Google Gemini
        let styledUrl = "";
        let styledPublicId = tempPublicId;

        if (process.env.GEMINI_API_KEY) {
            try {
                const parts = [];
                if (imageBuffer) {
                    parts.push({
                        inlineData: {
                            mimeType: imageMime,
                            data: imageBuffer.toString("base64")
                        }
                    });
                }
                parts.push({ text: targetedPrompt });

                console.log(`[Gemini Style Transform] Initiating ${normalizedStyle} cartoon generation...`);
                // Call Google's Gemini 2.5 Flash Image model with 45s timeout
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
                if (geminiRes.status !== 200) {
                    console.error(`[Gemini Error ${geminiRes.status}]:`, JSON.stringify(geminiData?.error || geminiData));
                }

                const imagePart = geminiData.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

                if (imagePart?.inlineData?.data) {
                    const dataUri = `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`;
                    const cloudStyled = await cloudinary.uploader.upload(dataUri, {
                        folder: "bloom_posts/styled"
                    });
                    if (cloudStyled?.secure_url) {
                        styledUrl = cloudStyled.secure_url;
                        styledPublicId = cloudStyled.public_id;
                        console.log(`[Gemini Style Transform] Successfully generated and uploaded pure cartoon ${normalizedStyle} image!`);
                    }
                }
            } catch (geminiErr) {
                console.warn("[Gemini Style Transform Warning]:", geminiErr.message);
            }
        }

        // Failsafe: if network timeout occurs during neural generation, apply artistic transformation
        if (!styledUrl) {
            let transformationConfig = [];
            if (normalizedStyle === "ghibli") {
                transformationConfig = [
                    { effect: "art:primavera" },
                    { effect: "vibrance:40" },
                    { effect: "saturation:20" }
                ];
            } else if (normalizedStyle === "anime") {
                transformationConfig = [
                    { effect: "cartoonify:60:50" },
                    { effect: "contrast:20" },
                    { effect: "sharpen:100" }
                ];
            } else if (normalizedStyle === "pixar") {
                transformationConfig = [
                    { effect: "cartoonify:20:30" },
                    { effect: "improve:indoor" },
                    { effect: "fill_light:20" }
                ];
            }

            const transformedUrl = cloudinary.url(tempPublicId, {
                transformation: transformationConfig,
                secure: true
            });

            const cloudStyled = await cloudinary.uploader.upload(transformedUrl, {
                folder: "bloom_posts/styled"
            });

            styledUrl = cloudStyled?.secure_url;
            styledPublicId = cloudStyled?.public_id;
        }

        // Strictly enforce converted image validation: never return or upload original image as fallback
        if (!styledUrl) {
            return res.status(500).json({
                message: `Failed to convert image to ${normalizedStyle}. Please try again.`,
                success: false
            });
        }

        return res.status(200).json({
            message: `Image successfully converted to ${normalizedStyle}`,
            success: true,
            styledUrl,
            publicId: styledPublicId,
            style: normalizedStyle,
            originalUrl: tempOriginalUrl,
            tempOriginalUrl,
            tempPublicId
        });
    } catch (error) {
        console.error("Error transforming image style:", error);
        return res.status(500).json({
            message: error.message || "Failed to transform image style. Please retry.",
            success: false
        });
    }
};