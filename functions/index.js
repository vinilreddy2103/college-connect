const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.getUpcomingEvents = functions.https.onCall(async (data, context) => {
    // Check if the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "You must be logged in to view events."
        );
    }

    const collegeId = data.collegeId;
    if (!collegeId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "A collegeId must be provided."
        );
    }

    // Get the current server date in YYYY-MM-DD format
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

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