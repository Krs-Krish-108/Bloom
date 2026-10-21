import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getConversations, getMessage, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.route("/conversations").get(isAuthenticated, getConversations);
router.route("/send/:id").post(isAuthenticated, sendMessage);
router.route("/all/:id").get(isAuthenticated, getMessage);

export default router;

