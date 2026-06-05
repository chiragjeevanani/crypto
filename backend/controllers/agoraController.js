const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Utility to generate token
const generateToken = (req, res) => {
    // Get parameters from query string
    const { channelName, uid } = req.query;

    if (!channelName) {
        return res.status(400).json({ error: 'channelName is required' });
    }

    // Get the App ID and Certificate from environment variables
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
        console.error("Agora App ID or Certificate is missing in .env");
        return res.status(500).json({ error: 'Agora credentials not configured on the server' });
    }

    // Set role to Publisher so they can transmit audio/video
    const role = RtcRole.PUBLISHER;

    // Set privilege expiration time (default to 1 hour)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // The UID must be an integer for RtcTokenBuilder. 
    // If we pass 0, Agora will automatically assign a UID to the user when they join.
    // If the frontend sends a string uid, we can try to hash it, or just use 0.
    const numericUid = uid ? parseInt(uid, 10) : 0;
    const finalUid = isNaN(numericUid) ? 0 : numericUid;

    try {
        // Generate Token
        const token = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            finalUid,
            role,
            privilegeExpiredTs
        );

        return res.json({ token, channelName, uid: finalUid });
    } catch (error) {
        console.error("Error generating Agora token:", error);
        return res.status(500).json({ error: 'Failed to generate token' });
    }
};

module.exports = {
    generateToken
};
