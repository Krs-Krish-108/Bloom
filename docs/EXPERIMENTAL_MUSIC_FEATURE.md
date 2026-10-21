# EXPERIMENTAL FEATURE CHECKPOINT: Instagram-Style Music Integration (iTunes API)

> **Status:** Experimental  
> **Created At:** 2026-10-22  
> **Purpose:** Add Instagram-style music to Posts and Stories with iTunes 30-sec previews, carousel-wide single audio, video-pause interaction, and horizontal midline viewport scroll auto-switching.

---

## 1. Files Added
1. `backend/controllers/music.controller.js` — iTunes Search & Trending proxy with caching.
2. `backend/routes/music.route.js` — Express routes for `/api/v1/music/search` and `/api/v1/music/trending`.
3. `frontend/src/context/FeedAudioContext.jsx` — Scroll midline viewport audio coordinator.
4. `frontend/src/components/MusicPickerModal.jsx` — Instagram-style music search & preview picker.
5. `docs/EXPERIMENTAL_MUSIC_FEATURE.md` — This checkpoint file.

---

## 2. Files Modified
1. `backend/models/post.model.js` — Added optional `music` field.
2. `backend/models/story.model.js` — Added optional `music` field.
3. `backend/controllers/post.controller.js` — Reads & stores `music` in `addnewPost`.
4. `backend/controllers/story.controller.js` — Reads & stores `music` in `addNewStory`.
5. `backend/index.js` — Mounted `/api/v1/music`.
6. `frontend/src/components/CreatePost.jsx` — "Add music" option with MusicPickerModal.
7. `frontend/src/components/Stories.jsx` — "Add music" option in story creation.
8. `frontend/src/components/ui/story-viewer.jsx` — Plays music & displays track badge on stories.
9. `frontend/src/components/Post.jsx` — Instagram music header badge, video pause interaction, midline scroll registration.
10. `frontend/src/components/Posts.jsx` — Wrapped feed in FeedAudioProvider.

---

## 3. How to Completely Remove (1-Minute Revert)
If the user requests removal:
1. Delete added files:
   - `Remove-Item backend/controllers/music.controller.js`
   - `Remove-Item backend/routes/music.route.js`
   - `Remove-Item frontend/src/context/FeedAudioContext.jsx`
   - `Remove-Item frontend/src/components/MusicPickerModal.jsx`
   - `Remove-Item docs/EXPERIMENTAL_MUSIC_FEATURE.md`
2. In `backend/index.js`: Remove `import musicRoute` and `app.use("/api/v1/music", musicRoute)`.
3. In `backend/models/post.model.js` and `story.model.js`: Remove `music` schema object.
4. In `frontend/src/components/CreatePost.jsx` and `Stories.jsx`: Remove `MusicPickerModal` and `selectedMusic`.
5. In `frontend/src/components/Post.jsx` and `Posts.jsx`: Remove `FeedAudioContext` hooks.
