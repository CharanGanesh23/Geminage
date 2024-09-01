const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const multer = require("multer");
const dotenv = require('dotenv');
const cors = require('cors');  

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());  

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const upload = multer({ dest: 'uploads/' });
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString("base64"),
            mimeType
        }
    };
}
app.post('/process-image', upload.single('image'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        const imagePart = fileToGenerativePart(filePath, mimeType);
        const prompt = "Analyze this image";

        const result = await model.generateContent([prompt, imagePart]);
        console.log(JSON.stringify(result, null, 2));  // Log the entire result to inspect its structure

        const candidates = result.response.candidates;
        let responseText = "No response received.";
        
        if (candidates && candidates.length > 0) {
            console.log('Candidates array contents:', candidates);  // Log the candidates array
            if (candidates[0].content && candidates[0].content.parts && candidates[0].content.parts.length > 0) {
                responseText = candidates[0].content.parts[0].text;
            } else {
                console.error('Candidates array does not contain the expected structure');
            }
        } else {
            console.error('Candidates array is empty or does not contain text property');
        }

        // Send the result back to the client
        res.send(responseText);

        // Clean up the uploaded file
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred during the processing.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
