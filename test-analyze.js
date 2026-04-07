const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testAnalyze() {
  try {
    const formData = new FormData();
    formData.append('jobDescription', 'Looking for a React developer with 5+ years experience');
    formData.append('resumes', fs.createReadStream('test-resume.pdf'), 'test-resume.pdf');

    const response = await axios.post('http://localhost:3000/api/analyze', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluX2RlZmF1bHQiLCJlbWFpbCI6ImRhcnNoYW5uZXVyb2xhYnNAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwibmFtZSI6Ik5ldXJvbGFicyBBZG1pbiIsImlhdCI6MTc3NTU1MjcxMiwiZXhwIjoxNzc2MTU3NTEyfQ.B1dLKM8DggnkApDfjMW5tsDHxLXpFhfOKwBLy4OWim4'
      }
    });

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAnalyze();
