console.log('Testing pdf-parse module structure:');
const pdf = require('pdf-parse');
console.log('pdf-parse object:', typeof pdf);
console.log('pdf-parse keys:', Object.keys(pdf));
console.log('pdf-parse default:', typeof pdf.default);

// Test with a simple buffer
async function test() {
  try {
    const result = await pdf(Buffer.from('test'));
    console.log('PDF parsing result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
