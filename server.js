import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

app.post('/api/inflation', async (req, res) => {
  try {
    const { startYear, endYear } = req.body;
    
    console.log('Received request:', { startYear, endYear });
    console.log('Using API Key:', process.env.VITE_BLS_API_KEY ? 'Present' : 'Missing');
    
    const response = await fetch(BLS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seriesid: ['CUUR0000SA0'],
        startyear: startYear,
        endyear: endYear,
        registrationkey: process.env.VITE_BLS_API_KEY
      })
    });

    const data = await response.json();
    console.log('BLS API Response:', data);
    res.json(data);
  } catch (error) {
    console.error('Proxy server error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 