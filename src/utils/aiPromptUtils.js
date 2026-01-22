// src/utils/aiPromptUtils.js

const STYLE_PRESETS = {
    technical: "futuristic, cyberpunk aesthetic, neon blue and purple lighting, 3d render of circuit patterns, high tech, dark background, 8k resolution",
    cultural: "vibrant, energetic, festival atmosphere, bokeh lights, confetti, abstract artistic splashes, warm colors, cinematic lighting",
    workshop: "clean, minimalist, bauhaus style, geometric shapes, soft professional lighting, organized composition, high contrast",
    sports: "dynamic motion, high contrast, energetic, sharp focus, dramatic shadows, stadium atmosphere",
    general: "modern, clean, professional academic background, soft gradient, high quality, abstract shapes"
};

function sanitizeInput(text) {
    if (!text) return "";
    return text.toLowerCase()
        .replace(/nsfw|nude|adult|explicit|blood|violence|kill|weapon/g, "")
        .replace(/political|election|vote/g, "")
        .slice(0, 150)
        .trim();
}

export const constructSmartPrompt = (category, userTheme, userDescription) => {
    const baseStyle = STYLE_PRESETS[category] || STYLE_PRESETS.general;
    const theme = sanitizeInput(userTheme);
    
    // We strictly ask for BACKGROUND ART to avoid text generation
    const prompt = `
      High-quality abstract background art for a college event flyer.
      Subject: ${theme || "Academic Event"}
      
      Artistic Style: ${baseStyle}
      
      Composition Rules:
      - Wide angle, cinematic lighting.
      - Leave a large, clean, dark negative space in the center for text overlay.
      - NO text, NO letters, NO words inside the image.
      - NO people faces.
    `;

    return { prompt };
};