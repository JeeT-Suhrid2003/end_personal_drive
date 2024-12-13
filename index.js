const http = require('http');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Google Drive API setup
const CLIENT_ID = '628119764907-okmugs74ec3tj0vst880e9eujftpu65g.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04ZgOS8a7fugyCgYIARAAGAQSNwF-L9Ir5SPYl_Lqgf9LPvZ-IVd3p1xZcCUW_KM6rXIWQpmzsoqF5zAsUrGanuTgH3SUCAr2odM';

const oauth2client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2client });

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        // Serve the index.html file
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (req.method === 'POST' && req.url === '/upload') {
        const boundary = req.headers['content-type'].split('boundary=')[1];
        const chunks = [];

        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
            const data = Buffer.concat(chunks);
            const parts = data.toString().split(`--${boundary}`);

            // Extract file data
            const filePart = parts.find((part) => part.includes('Content-Disposition: form-data; name="file"'));
            const [headers, fileData] = filePart.split('\r\n\r\n');
            const filenameMatch = headers.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : 'uploaded_file';

            const tempFilePath = path.join(__dirname, filename);

            // Save file temporarily
            fs.writeFileSync(tempFilePath, fileData.trimEnd());

            // Upload to Google Drive
            try {
                const response = await drive.files.create({
                    requestBody: { name: filename },
                    media: { body: fs.createReadStream(tempFilePath) },
                    fields: 'id, webViewLink, webContentLink, name',
                });

                // Clean up the temporary file
                fs.unlinkSync(tempFilePath);

                // Respond with the uploaded file's metadata
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response.data));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Start the server
server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
