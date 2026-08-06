const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3002;

app.post('/scan', async (req, res) => {
  try {
    const { biometricId } = req.body; 
    
    if (!biometricId) {
      return res.status(400).json({ error: 'No biometric ID provided' });
    }

    console.log(`🖐️ USB Scanner captured ID: ${biometricId}`);

    // No token needed anymore!
    const response = await axios.post('http://127.0.0.1:3001/attendance/biometric-scan', {
      biometricId: biometricId,
      deviceName: 'DigitalPersona_USB_Scanner'
    });
    
    console.log('✅ Attendance recorded:', response.data.message);
    console.log('   Status:', response.data.status);
    
    res.json({ success: true, message: 'Scan successful', data: response.data });
    
  } catch (error) {
    console.error('❌ Error processing scan:', error.message);
    if (error.response) {
      console.error('Backend replied with:', error.response.status, error.response.data);
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/status', (req, res) => {
  res.json({
    status: 'USB Middleware is running and ready.',
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 USB Scanner Middleware running on http://127.0.0.1:${PORT}`);
  console.log('📍 Backend URL: http://127.0.0.1:3001');
  console.log('Waiting for USB scanner input...\n');
});