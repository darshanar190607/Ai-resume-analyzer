const { PDFParse } = require('pdf-parse');

async function test() {
  try {
    const pdfParser = new PDFParse({ verbosity: 0 });
    console.log('PDFParse methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(pdfParser)));
    console.log('PDFParse own methods:', Object.getOwnPropertyNames(pdfParser));
    
    // Try different method names
    const testBuffer = Buffer.from('%PDF-1.4 test');
    
    if (typeof pdfParser.parse === 'function') {
      console.log('Using parse method');
      const result = await pdfParser.parse(testBuffer);
    } else if (typeof pdfParser.parseBuffer === 'function') {
      console.log('Using parseBuffer method');
      const result = await pdfParser.parseBuffer(testBuffer);
    } else {
      console.log('No parse method found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
