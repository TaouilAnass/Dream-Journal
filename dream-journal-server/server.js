const express = require('express');
const cors = require('cors');
const Bytez = require('bytez.js');

const app = express();
const PORT = 5000;

// Enable CORS for React app
app.use(cors());
app.use(express.json());

// Initialize Bytez
const sdk = new Bytez('d4f2d51055d7919829aa14f1cfe4ceae');
const model = sdk.model('stabilityai/stable-diffusion-xl-base-1.0');

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Dream Journal API is running' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy' });
});

// API endpoint to generate images
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Generating image for:', prompt);
    
    const { error, output } = await model.run(prompt);
    
    if (error) {
      console.error('Bytez error:', error);
      return res.status(500).json({ error });
    }
    
    res.json({ image: output });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export for Vercel
module.exports = app;

// Keep this for local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`React app should call http://localhost:${PORT}/api/generate`);
  });
}