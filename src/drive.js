const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const CLIENT_ID = '454455339224-0ejfctpjl1a6u1nau00hqlvvskrvpu4t.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
}

async function authenticate(code) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
}

async function uploadFile(filePath, mimeType) {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const fileMetadata = {
        name: path.basename(filePath),
    };

    const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
    });

    return response.data.id;
}

module.exports = {
    getAuthUrl,
    authenticate,
    uploadFile,
};
