import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDataUri } from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { getReceiverSocketId, io } from "../socket/socket.js";


export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        }
        const existingUserByemail = await User.findOne({ email });
        if (existingUserByemail) {
            return res.status(409).json({
                message: "Email Already exist. Try another email.",
                success: false
            });
        }
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(409).json({
                message: "Username Already exist. Try something else.",
                success: false
            });
        }
        const hashedpassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            email,
            password: hashedpassword
        });

        return res.status(201).json({
            message: "Account created successfully",
            success: true,
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}


export const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "Something is missing",
                success: false
            });
        }

        email = email.trim();
        let isAdminLogin = false;
        let searchEmail = email;

        if (email.toLowerCase().startsWith("admin.")) {
            isAdminLogin = true;
            const exactUser = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
            if (!exactUser) {
                searchEmail = email.slice(6).trim();
            }
        }

        const user = await User.findOne({ email: new RegExp(`^${searchEmail}$`, "i") });
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
                success: false
            });
        }

        if (
            user.isAdmin === true ||
            user.email?.toLowerCase().startsWith("admin.") ||
            user.email?.toLowerCase().startsWith("admin@") ||
            user.username?.toLowerCase() === "admin"
        ) {
            isAdminLogin = true;
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
                success: false
            });
        }

        const populatedPosts = await Promise.all(
            (user.posts || []).map(async (postId) => {
                const post = await Post.findById(postId);
                if (post && post.author.equals(user._id)) {
                    return post;
                }
                return null;
            })
        );

        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: populatedPosts.filter(Boolean),
            bookmarks: user.bookmarks,
            isAdmin: isAdminLogin
        };

        const token = jwt.sign(
            { userId: user._id, isAdmin: isAdminLogin },
            process.env.SECRET_KEY,
            { expiresIn: '1d' }
        );

        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: isProduction ? 'none' : 'lax',
            secure: isProduction,
            path: '/',
            maxAge: 24 * 60 * 60 * 1000
        }).json({
            message: isAdminLogin ? `Welcome Admin ${user.username}` : `Welcome back ${user.username}`,
            success: true,
            user: userData
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server error",
            success: false
        });
    }
}


export const logout = async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        return res.cookie("token", "", {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
            path: "/",
            expires: new Date(0)
        }).status(200).json({
            message: "Logged out successfully",
            success: true
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Logout failed",
            success: false
        });
    }
};


export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const viewerId = req.id ? req.id.toString() : null;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                message: "Invalid user ID",
                success: false
            });
        }

        const user = await User.findById(userId)
            .select("-password")
            .populate({
                path: "posts",
                options: { sort: { createdAt: -1 } },
                populate: [
                    { path: "author", select: "username profilePicture" },
                    { path: "comments", options: { sort: { createdAt: -1 } }, populate: { path: "author", select: "username profilePicture" } }
                ]
            })
            .populate({
                path: "bookmarks",
                options: { sort: { createdAt: -1 } },
                populate: [
                    { path: "author", select: "username profilePicture" },
                    { path: "comments", options: { sort: { createdAt: -1 } }, populate: { path: "author", select: "username profilePicture" } }
                ]
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        const userObj = user.toObject();
        const isOwner = viewerId && viewerId === userId.toString();
        const isAdmin = Boolean(req.isAdmin);

        // Enforce Video Privacy Rule: non-owners and non-admins only see images, not videos!
        if (!isOwner && !isAdmin && userObj.posts) {
            userObj.posts = userObj.posts.map((post) => {
                if (post.media) {
                    post.media = post.media.filter((m) => m.mediaType === "image");
                }
                return post;
            });
        }

        return res.status(200).json({
            user: userObj,
            success: true
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server error",
            success: false
        });
    }
}


export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { gender, bio } = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        if (bio !== undefined) {
            user.bio = bio;
        }
        if (cloudResponse) {
            user.profilePicture = cloudResponse.secure_url;
        }
        if (gender !== undefined) {
            user.gender = gender;
        }
        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            user
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server error",
            success: false
        });
    }
}


export const getSuggestedUsers = async (req, res) => {
    try {
        // 1. Find the currently logged-in user
        const currentUser = await User.findById(req.id)
            .select("following followers");

        if (!currentUser) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // 2. Store IDs of users whom current user already follows
        const followingIds = currentUser.following.map(
            id => id.toString()
        );

        const followingSet = new Set(followingIds);

        // 3. Find users whom the current user follows
        const followedUsers = await User.find({
            _id: { $in: currentUser.following }
        }).select("following followers");

        // 4. Score potential suggestions
        const suggestionScores = new Map();

        const addSuggestion = (candidateId, score = 1) => {
            const id = candidateId.toString();

            // Don't suggest yourself or users already followed
            if (
                id === currentUser._id.toString() ||
                followingSet.has(id)
            ) {
                return;
            }

            suggestionScores.set(
                id,
                (suggestionScores.get(id) || 0) + score
            );
        };

        // 5. Suggest users connected to people you follow
        for (const followedUser of followedUsers) {
            for (const id of followedUser.following) {
                addSuggestion(id, 2);
            }

            for (const id of followedUser.followers) {
                addSuggestion(id, 1);
            }
        }

        // 6. Add users who share followers with you
        const currentFollowerIds = new Set(
            currentUser.followers.map(id => id.toString())
        );

        if (currentFollowerIds.size > 0) {
            const sharedFollowerUsers = await User.find({
                followers: { $in: [...currentFollowerIds] },
                _id: {
                    $ne: currentUser._id,
                    $nin: currentUser.following
                }
            }).select("_id");

            for (const candidate of sharedFollowerUsers) {
                addSuggestion(candidate._id, 1);
            }
        }

        // 7. Fetch suggested user profiles without passwords
        const candidateIds = [...suggestionScores.keys()];

        let suggestedUsers = await User.find({
            _id: { $in: candidateIds }
        }).select("-password");

        // 8. Rank users with stronger connections first
        suggestedUsers.sort((a, b) => {
            return (
                suggestionScores.get(b._id.toString()) -
                suggestionScores.get(a._id.toString())
            );
        });

        // 9. Fill remaining suggestions if needed
        if (suggestedUsers.length < 10) {
            const existingIds = suggestedUsers.map(
                user => user._id
            );

            const excludedIds = [
                currentUser._id,
                ...currentUser.following,
                ...existingIds
            ];

            const additionalUsers = await User.find({
                _id: { $nin: excludedIds }
            })
                .select("-password")
                .limit(10 - suggestedUsers.length);

            suggestedUsers.push(...additionalUsers);
        }

        // 10. Return the final suggestions
        return res.status(200).json({
            success: true,
            count: suggestedUsers.length,
            users: suggestedUsers.slice(0, 10),
            suggestedUsers: suggestedUsers.slice(0, 10)
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};


export const followOrUnfollow = async (req, res) => {
    try {
        const currentUserId = req.id;
        const targetUserId = req.params.id;

        if (!mongoose.isValidObjectId(currentUserId) || !mongoose.isValidObjectId(targetUserId)) {
            return res.status(400).json({
                message: "Invalid user ID",
                success: false
            });
        }

        if (currentUserId.toString() === targetUserId.toString()) {
            return res.status(400).json({
                message: "You cannot follow/unfollow yourself",
                success: false
            });
        }

        const user = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!user || !targetUser) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        const alreadyFollowing = user.following.some(
            id => id.toString() === targetUserId.toString()
        );

        if (alreadyFollowing) {
            await Promise.all([
                User.updateOne(
                    { _id: currentUserId },
                    { $pull: { following: targetUserId } }
                ),
                User.updateOne(
                    { _id: targetUserId },
                    { $pull: { followers: currentUserId } }
                )
            ]);

            return res.status(200).json({
                message: "Unfollowed successfully",
                success: true
            });
        }

        await Promise.all([
            User.updateOne(
                { _id: currentUserId },
                { $addToSet: { following: targetUserId } }
            ),
            User.updateOne(
                { _id: targetUserId },
                { $addToSet: { followers: currentUserId } }
            )
        ]);

        const followNotification = {
            type: "follow",
            userId: currentUserId,
            userDetails: {
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture
            },
            message: "started following you.",
            createdAt: new Date().toISOString()
        };
        const receiverSocketId = getReceiverSocketId(targetUserId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("notification", followNotification);
        }

        return res.status(200).json({
            message: "Followed successfully",
            success: true
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal Server error",
            success: false
        });
    }
};

// Admin: Get all registered user accounts
export const getAllUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.id);
        const isAdmin = Boolean(
            req.isAdmin ||
            currentUser?.isAdmin ||
            currentUser?.email?.toLowerCase().includes("admin") ||
            currentUser?.username?.toLowerCase().includes("admin")
        );

        if (!isAdmin) {
            return res.status(403).json({
                message: "Unauthorized: Admin privileges required",
                success: false
            });
        }

        const users = await User.find({})
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            users,
            count: users.length
        });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        return res.status(500).json({
            message: "Internal Server error",
            success: false
        });
    }
};

// Admin: Delete a user account and associated content
export const deleteUserAccount = async (req, res) => {
    try {
        const currentUser = await User.findById(req.id);
        const isAdmin = Boolean(
            req.isAdmin ||
            currentUser?.isAdmin ||
            currentUser?.email?.toLowerCase().includes("admin") ||
            currentUser?.username?.toLowerCase().includes("admin")
        );

        if (!isAdmin) {
            return res.status(403).json({
                message: "Unauthorized: Admin privileges required",
                success: false
            });
        }

        const targetUserId = req.params.id;
        if (!mongoose.isValidObjectId(targetUserId)) {
            return res.status(400).json({
                message: "Invalid user ID",
                success: false
            });
        }

        // Prevent admin from accidentally deleting their own currently logged-in account
        if (req.id.toString() === targetUserId.toString()) {
            return res.status(400).json({
                message: "You cannot delete your own admin account",
                success: false
            });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // 1. Delete all posts by this user
        await Post.deleteMany({ author: targetUserId });

        // 2. Remove user from followers and following arrays of all other users
        await User.updateMany(
            { $or: [{ followers: targetUserId }, { following: targetUserId }] },
            { $pull: { followers: targetUserId, following: targetUserId } }
        );

        // 3. Delete the user document
        await User.findByIdAndDelete(targetUserId);

        return res.status(200).json({
            message: `Account @${targetUser.username} deleted successfully`,
            success: true
        });
    } catch (error) {
        console.error("Error in deleteUserAccount:", error);
        return res.status(500).json({
            message: "Internal Server error",
            success: false
        });
    }
};