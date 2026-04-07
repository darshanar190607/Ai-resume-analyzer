const pdfParse = require("pdf-parse");
const fs = require("fs");

async function test() {
    try {
        const dataBuffer = fs.readFileSync("test-resume.pdf");
        console.log("Reading PDF...");
        const data = await pdfParse(dataBuffer);
        console.log("Extracted text length:", data.text.length);
        console.log("Sample text:", data.text.substring(0, 50));
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
