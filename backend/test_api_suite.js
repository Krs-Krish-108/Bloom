import dotenv from "dotenv";
dotenv.config();

import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./utils/db.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import messageRoutes from "./routes/message.route.js";
import { User } from "./models/user.model.js";
import { Post } from "./models/post.model.js";
import Comment from "./models/comments.model.js";
import Message from "./models/message.model.js";
import Conversation from "./models/conversation.model.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/post", postRoutes);
app.use("/api/v1/message", messageRoutes);

app.get("/", (req, res) => {
    res.status(200).json({ message: "I'm coming from backend", success: true });
});

const TEST_PORT = 8011;
let server;

const testResults = [];
function record(name, passed, details = "") {
    testResults.push({ name, passed, details });
    const mark = passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${mark} | ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runTestSuite() {
    console.log("==================================================");
    console.log("   FULL BACKEND END-TO-END API TEST SUITE");
    console.log("==================================================");

    try {
        await connectDB();
        server = app.listen(TEST_PORT);
        const baseUrl = `http://localhost:${TEST_PORT}`;

        const timestamp = Date.now();
        const userA = {
            username: `testerA_${timestamp}`,
            email: `testerA_${timestamp}@example.com`,
            password: "Password123!"
        };
        const userB = {
            username: `testerB_${timestamp}`,
            email: `testerB_${timestamp}@example.com`,
            password: "Password123!"
        };

        let cookieA = "";
        let cookieB = "";
        let userAId = "";
        let userBId = "";
        let createdPostId = "";
        let createdCommentId = "";

        // 1. Health check
        {
            const res = await fetch(`${baseUrl}/`);
            const data = await res.json();
            record("GET / (Root health check)", res.status === 200 && data.success === true);
        }

        // 2. User Registration (User A)
        {
            const res = await fetch(`${baseUrl}/api/v1/user/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userA)
            });
            const data = await res.json();
            record("POST /api/v1/user/register (User A)", res.status === 201 && data.success === true, data.message);
        }

        // 3. User Registration (User B)
        {
            const res = await fetch(`${baseUrl}/api/v1/user/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userB)
            });
            const data = await res.json();
            record("POST /api/v1/user/register (User B)", res.status === 201 && data.success === true, data.message);
        }

        // 4. Duplicate Registration Guard
        {
            const res = await fetch(`${baseUrl}/api/v1/user/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userA)
            });
            const data = await res.json();
            record("POST /api/v1/user/register (Duplicate check)", (res.status === 409 || res.status === 400) && data.success === false, data.message);
        }

        // 5. User Login (User A)
        {
            const res = await fetch(`${baseUrl}/api/v1/user/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userA.email, password: userA.password })
            });
            const rawCookie = res.headers.get("set-cookie") || "";
            cookieA = rawCookie.split(";")[0]; // extract token=...
            const data = await res.json();
            userAId = data.user?._id;
            record("POST /api/v1/user/login (User A)", res.status === 200 && data.success === true && !!cookieA, `User ID: ${userAId}`);
        }

        // 6. User Login (User B)
        {
            const res = await fetch(`${baseUrl}/api/v1/user/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userB.email, password: userB.password })
            });
            const rawCookie = res.headers.get("set-cookie") || "";
            cookieB = rawCookie.split(";")[0];
            const data = await res.json();
            userBId = data.user?._id;
            record("POST /api/v1/user/login (User B)", res.status === 200 && data.success === true && !!cookieB, `User ID: ${userBId}`);
        }

        // 7. Get User Profile (Public/Auth)
        {
            const res = await fetch(`${baseUrl}/api/v1/user/${userAId}/profile`, {
                headers: { Cookie: cookieA }
            });
            const data = await res.json();
            record("GET /api/v1/user/:id/profile", res.status === 200 && data.user?.username === userA.username);
        }

        // 8. Get Suggested Users
        {
            const res = await fetch(`${baseUrl}/api/v1/user/suggested`, {
                headers: { Cookie: cookieA }
            });
            const data = await res.json();
            record("GET /api/v1/user/suggested", res.status === 200 && data.success === true && (Array.isArray(data.users) || Array.isArray(data.suggestedUsers)));
        }

        // 9. Follow / Unfollow user
        {
            // User A follows User B
            const followRes = await fetch(`${baseUrl}/api/v1/user/followorunfollow/${userBId}`, {
                method: "POST",
                headers: { Cookie: cookieA }
            });
            const followData = await followRes.json();
            const followed = followRes.status === 200 && followData.message?.toLowerCase().includes("followed");

            // User A unfollows User B
            const unfollowRes = await fetch(`${baseUrl}/api/v1/user/followorunfollow/${userBId}`, {
                method: "POST",
                headers: { Cookie: cookieA }
            });
            const unfollowData = await unfollowRes.json();
            const unfollowed = unfollowRes.status === 200 && unfollowData.message?.toLowerCase().includes("unfollowed");

            record("POST /api/v1/user/followorunfollow/:id (Follow & Unfollow cycle)", followed && unfollowed);
        }

        // 10. Create Post for testing Post routes
        // (Create directly in DB so we test all post endpoints without requiring live external Cloudinary upload mock)
        const samplePost = await Post.create({
            caption: "Hello World Instagram Clone Test",
            image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            author: userAId
        });
        createdPostId = samplePost._id.toString();
        await User.findByIdAndUpdate(userAId, { $push: { posts: samplePost._id } });
        record("DB: Seed sample post for Post API testing", !!createdPostId, `Post ID: ${createdPostId}`);

        // 11. Get All Posts
        {
            const res = await fetch(`${baseUrl}/api/v1/post/all`, {
                headers: { Cookie: cookieA }
            });
            const data = await res.json();
            record("GET /api/v1/post/all", res.status === 200 && data.success === true && Array.isArray(data.posts));
        }

        // 12. Get User's Posts
        {
            const res = await fetch(`${baseUrl}/api/v1/post/userpost/all`, {
                headers: { Cookie: cookieA }
            });
            const data = await res.json();
            record("GET /api/v1/post/userpost/all", res.status === 200 && data.success === true && data.posts.length >= 1);
        }

        // 13. Like Post (hybrid POST & GET support)
        {
            const resPost = await fetch(`${baseUrl}/api/v1/post/${createdPostId}/like`, {
                method: "POST",
                headers: { Cookie: cookieB }
            });
            const dataPost = await resPost.json();
            record("POST /api/v1/post/:id/like (User B likes User A's post)", resPost.status === 200 && dataPost.success === true);

            // Unlike Post
            const resDislike = await fetch(`${baseUrl}/api/v1/post/${createdPostId}/dislike`, {
                method: "POST",
                headers: { Cookie: cookieB }
            });
            const dataDislike = await resDislike.json();
            record("POST /api/v1/post/:id/dislike (User B dislikes/unlikes)", resDislike.status === 200 && dataDislike.success === true);

            // Test GET fallback for Like (used by video tutorial)
            const resGetLike = await fetch(`${baseUrl}/api/v1/post/${createdPostId}/like`, {
                method: "GET",
                headers: { Cookie: cookieB }
            });
            const dataGetLike = await resGetLike.json();
            record("GET /api/v1/post/:id/like (Video frontend backward compatibility)", resGetLike.status === 200 && dataGetLike.success === true);
        }

        // 14. Add Comment
        {
            const res = await fetch(`${baseUrl}/api/v1/post/${createdPostId}/comment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: cookieB
                },
                body: JSON.stringify({ text: "Super cool test photo!" })
            });
            const data = await res.json();
            createdCommentId = data.comment?._id;
            record("POST /api/v1/post/:id/comment (User B comments on post)", res.status === 201 && data.success === true && !!createdCommentId);
        }

        // 15. Get Comments of Post
        {
            const res = await fetch(`${baseUrl}/api/v1/post/${createdPostId}/comment/all`, {
                headers: { Cookie: cookieA }
            });
            const data = await res.json();
            record("GET /api/v1/post/:id/comment/all", res.status === 200 && data.success === true && data.comments?.length >= 1);
        }

        // 16. Bookmark Post (hybrid POST & GET)
        {
            const resBookmark = await fetch(`${baseUrl}/api/v1/post/${createdPostId}/bookmark`, {
                method: "POST",
                headers: { Cookie: cookieB }
            });
            const dataBookmark = await resBookmark.json();
            const bookmarked = resBookmark.status === 200 && dataBookmark.type === "saved";

            const resUnbookmark = await fetch(`${baseUrl}/api/v1/post/${createdPostId}/bookmark`, {
                method: "GET",
                headers: { Cookie: cookieB }
            });
            const dataUnbookmark = await resUnbookmark.json();
            const unbookmarked = resUnbookmark.status === 200 && dataUnbookmark.type === "unsaved";

            record("POST/GET /api/v1/post/:id/bookmark (Bookmark & Unbookmark toggle)", bookmarked && unbookmarked);
        }

        // 17. Send Message (User A to User B)
        {
            const res = await fetch(`${baseUrl}/api/v1/message/send/${userBId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: cookieA
                },
                body: JSON.stringify({ message: "Hello User B, testing DM feature!" })
            });
            const data = await res.json();
            record("POST /api/v1/message/send/:id (User A -> User B)", res.status === 201 && data.success === true && !!data.newMessage);
        }

        // 18. Prevent Self-Messaging
        {
            const res = await fetch(`${baseUrl}/api/v1/message/send/${userAId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: cookieA
                },
                body: JSON.stringify({ message: "Talking to myself" })
            });
            const data = await res.json();
            record("POST /api/v1/message/send/:id (Self-messaging prevention guard)", res.status === 400 && data.message?.toLowerCase().includes("yourself"));
        }

        // 19. Get Messages between User A and User B
        {
            const res = await fetch(`${baseUrl}/api/v1/message/all/${userBId}`, {
                headers: { Cookie: cookieA }
            });
            const data = await res.json();
            record("GET /api/v1/message/all/:id (Fetch conversation messages)", res.status === 200 && data.success === true && data.messages?.length >= 1);
        }

        // 20. Delete Post
        {
            // User B trying to delete User A's post (Unauthorized test)
            const unauthorizedRes = await fetch(`${baseUrl}/api/v1/post/delete/${createdPostId}`, {
                method: "DELETE",
                headers: { Cookie: cookieB }
            });
            const unauthData = await unauthorizedRes.json();
            const authGuardPassed = unauthorizedRes.status === 403;

            // User A deleting own post
            const authorRes = await fetch(`${baseUrl}/api/v1/post/delete/${createdPostId}`, {
                method: "DELETE",
                headers: { Cookie: cookieA }
            });
            const authorData = await authorRes.json();
            const deletePassed = authorRes.status === 200 && authorData.success === true;

            record("DELETE /api/v1/post/delete/:id (Ownership authorization & deletion)", authGuardPassed && deletePassed);
        }

        // 21. User Logout
        {
            const res = await fetch(`${baseUrl}/api/v1/user/logout`, {
                headers: { Cookie: cookieA }
            });
            const data = await res.json();
            record("GET /api/v1/user/logout", res.status === 200 && data.success === true);
        }

        // CLEANUP DB ENTRIES
        console.log("\nCleaning up test artifacts from database...");
        await Conversation.deleteMany({ participants: { $in: [userAId, userBId] } });
        await Message.deleteMany({ senderId: { $in: [userAId, userBId] } });
        if (createdCommentId) await Comment.findByIdAndDelete(createdCommentId);
        if (createdPostId) await Post.findByIdAndDelete(createdPostId);
        await User.deleteMany({ _id: { $in: [userAId, userBId] } });
        console.log("Cleanup completed.");

    } catch (err) {
        console.error("Test execution failed with error:", err);
    } finally {
        if (server) server.close();
        await mongoose.disconnect();
        console.log("\n==================================================");
        console.log("   TEST SUMMARY");
        console.log("==================================================");
        const total = testResults.length;
        const passed = testResults.filter(t => t.passed).length;
        const failed = total - passed;
        console.log(`Total tests: ${total} | Passed: ${passed} | Failed: ${failed}`);
        if (failed === 0) {
            console.log("🎉 ALL BACKEND APIS AND CONNECTIVITY TESTS PASSED 100%!");
        } else {
            console.log("⚠️ Some tests encountered issues. Review details above.");
        }
        console.log("==================================================");
    }
}

runTestSuite();
