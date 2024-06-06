require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns').promises; // Use the promises API for DNS
const Url = require('./model/url.js');

const app = express();
const MONGO_URI = process.env.MONGO_URI;
const port = process.env.PORT || 3000;

mongoose.connect(MONGO_URI, {}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

// Routes
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  const originalUrl = req.body.url;
  const urlPattern = /^(https?:\/\/)(www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(\/.*)?$/;

  if (!urlPattern.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const hostname = originalUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  try {
    const address = await dns.lookup(hostname);

    if (address) {
      const existingUrl = await Url.findOne({ original_url: originalUrl });
      if (existingUrl) {
        return res.json({ original_url: existingUrl.original_url, short_url: existingUrl.short_url });
      }

      const shortUrl = new Url({ original_url: originalUrl });
      const data = await shortUrl.save();
      return res.json({ original_url: data.original_url, short_url: data.short_url });
    }
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;
  
  try {
    const data = await Url.findOne({ short_url: shortUrl });
    if (data) {
      res.redirect(data.original_url);
    } else {
      res.json({ error: 'No shortUrl found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'internal error' });
  }
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port http://localhost:${port}`);
});
