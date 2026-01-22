const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const axios = require("axios");
const FormData = require("form-data");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// 1. Define BOTH secrets here
const clipdropApiKey = defineSecret("CLIPDROP_API_KEY");
const cohereApiKey = defineSecret("COHERE_API_KEY");

// --- EVENT FETCHING FUNCTION ---
exports.getUpcomingEvents = onCall(async (request) => {
    // Note: In v2 functions, we use 'request.auth', not 'context.auth'
    if (!request.auth) {
        console.warn("User is unauthenticated, allowing public read.");
    }

    const collegeId = request.data.collegeId;
    if (!collegeId) {
        throw new HttpsError("invalid-argument", "College ID is required.");
    }

    // Fix Timezone (UTC to IST)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const todayString = istDate.toISOString().split('T')[0];

    try {
        const eventsRef = db.collection("events");
        const q = eventsRef
            .where("collegeId", "==", collegeId)
            .where("status", "==", "approved")
            .where("date", ">=", todayString)
            .orderBy("date", "asc");

        const querySnapshot = await q.get();
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
        console.error("Error fetching events:", error);
        throw new HttpsError("internal", "Failed to fetch events.");
    }
});

// --- AI GENERATION FUNCTION ---
exports.generateEventPoster = onCall(
  { 
    secrets: [clipdropApiKey, cohereApiKey],
    timeoutSeconds: 120, 
    memory: "512MiB"
  }, 
  async (request) => {
    
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { eventType, title, description } = request.data;
    const userContext = `Event Type: ${eventType || "General"}. Title: ${title}. Description: ${description}`;

    const clipKey = clipdropApiKey.value().trim();
    const cohereKey = cohereApiKey.value().trim();

    try {
      // STEP A: Cohere (Now with a STYLE GUIDE)
      const cohereResponse = await axios.post(
        "https://api.cohere.ai/v1/chat",
        {
          model: "command-r-08-2024",
          message: `
            Act as an expert AI Art Director. I need a prompt for Stable Diffusion.
            
            Input Context: "${userContext}"
            
            STRICT VISUAL STYLE GUIDE:
            1. If "Technical/Hackathon": Use "Cyberpunk aesthetic, neon blue and green lighting, dark mode background, matrix code rain texture, circuit board patterns, futuristic, 8k resolution".
            2. If "Cultural/Fest": Use "Vibrant festival atmosphere, colorful bokeh lights, confetti, energetic motion blur, concert stage lighting, warm gold and purple tones".
            3. If "Workshop/Seminar": Use "Clean minimalist design, abstract geometric shapes, professional academic background, soft white and grey gradient, high key lighting".
            
            Rules:
            - NO text, NO letters, NO words in the image.
            - Leave a dark/clean negative space in the center/top for text overlay.
            - Return ONLY the raw prompt string.
          `,
          temperature: 0.3,
        },
        {
          headers: {
            "Authorization": `Bearer ${cohereKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      const enhancedPrompt = cohereResponse.data.text.trim();
      console.log("Enhanced Prompt:", enhancedPrompt);

      // STEP B: ClipDrop (Unchanged)
      const form = new FormData();
      form.append('prompt', enhancedPrompt); 

      const clipDropResponse = await axios.post(
        "https://clipdrop-api.co/text-to-image/v1",
        form,
        {
          headers: { 'x-api-key': clipKey, ...form.getHeaders() },
          responseType: 'arraybuffer' 
        }
      );

      const base64Image = Buffer.from(clipDropResponse.data, 'binary').toString('base64');
      const dataUri = `data:image/png;base64,${base64Image}`;

      return { imageUrl: dataUri, enhancedPrompt: enhancedPrompt }; 

    } catch (error) {
      let errorMessage = error.message;
      if (error.response && error.response.data) {
          const data = error.response.data;
          errorMessage = Buffer.isBuffer(data) ? data.toString() : JSON.stringify(data);
      }
      console.error("AI Pipeline Failed:", errorMessage);
      throw new HttpsError("internal", "AI generation failed: " + errorMessage);
    }
  }
);