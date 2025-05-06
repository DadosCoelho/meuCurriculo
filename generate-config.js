export default function handler(req, res) {
    res.status(200).json({
        GIST_ID: process.env.GIST_ID,
        GITHUB_USERNAME: process.env.GITHUB_USERNAME,
        PROFILE_IMAGE_URL: process.env.PROFILE_IMAGE_URL,
    });
}