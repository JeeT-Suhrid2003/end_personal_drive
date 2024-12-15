const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const app = express();

// Google Drive API setup
const CLIENT_ID = '628119764907-okmugs74ec3tj0vst880e9eujftpu65g.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04ZgOS8a7fugyCgYIARAAGAQSNwF-L9Ir5SPYl_Lqgf9LPvZ-IVd3p1xZcCUW_KM6rXIWQpmzsoqF5zAsUrGanuTgH3SUCAr2odM';

const oauth2client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2client });

// Multer setup for file handling
const upload = multer({ dest: 'uploads/' });

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
    const filePath = req.file.path; // Temporary file path
    const fileName = req.file.originalname;

    try {
        // Upload to Google Drive
        const response = await drive.files.create({
            requestBody: { name: fileName },
            media: { body: fs.createReadStream(filePath) },
            fields: 'id, webViewLink, webContentLink, name',
        });

        // Clean up temporary file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            ...response.data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
