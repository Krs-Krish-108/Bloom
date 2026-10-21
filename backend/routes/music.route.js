import express from "express";
import { searchMusic, getTrendingMusic } from "../controllers/music.controller.js";

const router = express.Router();

router.route("/search").get(searchMusic);
router.route("/trending").get(getTrendingMusic);

export default router;
