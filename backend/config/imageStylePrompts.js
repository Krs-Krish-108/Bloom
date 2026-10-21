// backend/config/imageStylePrompts.js
// Dedicated prompt configuration for distinct AI Image Styles.
// Provider-agnostic so it can be used with Gemini, OpenAI, or any image transformation provider.

export const IMAGE_STYLE_PROMPTS = {
    ghibli: "Completely redraw and transform this photo into a pure 2D hand-drawn Studio Ghibli anime cartoon character. DO NOT make it realistic or semi-realistic. It must look like a pure 2D animated cartoon movie frame from Hayao Miyazaki (like Spirited Away, Howl's Moving Castle, or Castle in the Sky). Stylize the person into a 2D anime cartoon character with big expressive anime eyes, clean hand-drawn ink outlines, simplified flat 2D cartoon anime facial features, soft pastel watercolor tones, and a whimsical fairytale Ghibli background. 100% 2D animated cartoon illustration, NOT a realistic photo.",
    anime: "Completely redraw and transform this photo into a pure vibrant Japanese 2D anime cartoon character illustration. DO NOT make it realistic or semi-realistic. It must look like a high-budget 2D Japanese anime movie by Makoto Shinkai or Kyoto Animation. Stylize the person into a 2D anime cartoon character with sharp cel-shaded anime line art, big sparkling anime cartoon eyes, styled anime hair highlights, and a vibrant colorful anime background with glowing sky effects. 100% 2D Japanese animated cartoon, NOT a realistic photo.",
    pixar: "Completely transform and render this photo into a lovable 3D Disney Pixar animated cartoon CGI character. DO NOT make it realistic. It must look like a still from a Disney Pixar animated movie (like The Incredibles, Luca, Up, or Toy Story). Stylize the subjects into charming 3D cartoon CGI characters with exaggerated expressive 3D cartoon facial proportions, large stylized animated eyes, smooth clay-like cartoon skin, subsurface scattering, and vibrant 3D animated Pixar charm. 100% 3D animated cartoon character, NOT a real human."
};

export const SUPPORTED_STYLE_KEYS = Object.keys(IMAGE_STYLE_PROMPTS);

export const STYLE_METADATA = {
    ghibli: {
        id: "ghibli",
        label: "Studio Ghibli style",
        description: "Hand-painted watercolor animation with a whimsical, cinematic atmosphere"
    },
    anime: {
        id: "anime",
        label: "2D Anime illustration",
        description: "Clean cel-shaded line art, sharp highlights, and balanced vibrant tones"
    },
    pixar: {
        id: "pixar",
        label: "Disney Pixar 3D style",
        description: "Polished stylized 3D animated film character with dimensional lighting"
    }
};

export const isValidStyle = (styleKey) => {
    return Boolean(styleKey && IMAGE_STYLE_PROMPTS[styleKey.toLowerCase()]);
};

export const getPromptForStyle = (styleKey) => {
    if (!styleKey) return null;
    return IMAGE_STYLE_PROMPTS[styleKey.toLowerCase()] || null;
};
