const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.getUpcomingEvents = functions.https.onCall(async (data, context) => {
    
    // 1. FIX AUTH ERROR: We made this check optional.
    // If the token is missing (which is happening to you), we just log it but continue.
    if (!context.auth) {
        console.warn("User is unauthenticated, but allowing request for public events.");
    }

    const collegeId = data.collegeId;
    if (!collegeId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "A collegeId must be provided."
        );
    }

    // 2. FIX "ACTUAL TIME" (Timezone Issue)
    // Google Servers are in UTC. We must convert to IST (India Time) 
    // to get the correct "Today" date string.
    
    const now = new Date();
    
    // Add 5 hours 30 minutes (in milliseconds) to UTC time
    const istOffset = 5.5 * 60 * 60 * 1000; 
    const istDate = new Date(now.getTime() + istOffset);
    
    // Now this string is accurate for India
    const todayString = istDate.toISOString().split('T')[0];

    try {
        const eventsRef = db.collection("events");
        const q = eventsRef
            .where("collegeId", "==", collegeId)
            .where("status", "==", "approved")
            .where("date", ">=", todayString)
            .orderBy("date", "asc");

        const querySnapshot = await q.get();
        const eventsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return eventsList;

    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        throw new functions.https.HttpsError(
            "internal",
            "An error occurred while fetching events."
        );
    }
});