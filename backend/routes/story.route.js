import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import {
    addNewStory,
    getAllStories,
    deleteStory
} from "../controllers/story.controller.js";

const router = express.Router();

router.route("/add").post(
    isAuthenticated,
    upload.fields([
        { name: "file", maxCount: 1 },
        { name: "media", maxCount: 1 }
    ]),
    addNewStory
);
router.route("/all").get(isAuthenticated, getAllStories);
router.route("/delete/:id").delete(isAuthenticated, deleteStory);

export default router;
