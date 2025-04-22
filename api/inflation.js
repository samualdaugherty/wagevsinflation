import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { startYear, endYear } = req.body;
    
    console.log('Received request:', { startYear, endYear });

    const apiKey = process.env.BLS_API_KEY;
    console.log('Using API Key:', apiKey ? 'Present' : 'Missing');

    const response = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey ? `Bearer ${apiKey}` : undefined
      },
      body: JSON.stringify({
        "seriesid": ["CUUR0000SA0"],
        "startyear": startYear.toString(),
        "endyear": endYear.toString(),
        "registrationkey": apiKey
      })
    });

    const data = await response.json();
    console.log('BLS API Response:', data);

    if (data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API request failed: ${data.message}`);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
} 