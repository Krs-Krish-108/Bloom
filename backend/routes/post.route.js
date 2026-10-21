import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import {
    addnewPost,
    getAllPosts,
    userkisariposts,
    likePost,
    unlikePost,
    addComment,
    getCommentsOfPost,
    deletePost,
    bookmarkPost,
    transformImageStyle
} from "../controllers/post.controller.js";

const router = express.Router();

router.route("/transform-style").post(
    isAuthenticated,
    upload.single("file"),
    transformImageStyle
);

router.route("/addpost").post(
    isAuthenticated,
    upload.fields([
        { name: "media", maxCount: 10 },
        { name: "image", maxCount: 10 }
    ]),
    addnewPost
);
router.route("/all").get(isAuthenticated, getAllPosts);
router.route("/userpost/all").get(isAuthenticated, userkisariposts);
router.route("/:id/like").get(isAuthenticated, likePost).post(isAuthenticated, likePost);
router.route("/:id/dislike").get(isAuthenticated, unlikePost).post(isAuthenticated, unlikePost);
router.route("/:id/comment").post(isAuthenticated, addComment);
router.route("/:id/comment/all").get(isAuthenticated, getCommentsOfPost);
router.route("/delete/:id").delete(isAuthenticated, deletePost);
router.route("/:id/bookmark").get(isAuthenticated, bookmarkPost).post(isAuthenticated, bookmarkPost);

export default router;
