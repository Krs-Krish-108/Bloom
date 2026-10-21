export const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:8000" : "");

export const USER_API_END_POINT = `${BASE_URL}/api/v1/user`;
export const POST_API_END_POINT = `${BASE_URL}/api/v1/post`;
export const MESSAGE_API_END_POINT = `${BASE_URL}/api/v1/message`;
export const STORY_API_END_POINT = `${BASE_URL}/api/v1/story`;

