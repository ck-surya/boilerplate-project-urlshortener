require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const Url = require("./model/url");

const app = express();
const db_uri = process.env.mongo_uri;


connectDB(db_uri);

const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;

  try {
    const hostname = new URL(url).hostname;

    dns.lookup(hostname, async (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      let existingUrl = await Url.findOne({ original_url: url });
      
      if (existingUrl) {
        return res.json({
          original_url: existingUrl.original_url,
          short_url: existingUrl.short_url,
        });
      }

      const count = await Url.countDocuments({});
      const shortUrl = count + 1; 
      const newUrl = new Url({ original_url: url, short_url: shortUrl });
      await newUrl.save();

      return res.json({
        original_url: url,
        short_url: shortUrl,
      });
    });
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const { short_url } = req.params;

  try {
    const doc = await Url.findOne({ short_url });

    if (!doc) {
      return res.json({ error: 'No short URL found' });
    }

    res.redirect(doc.original_url);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
