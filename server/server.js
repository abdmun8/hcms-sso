require('dotenv').config();
const express = require('express');
const { decode, verify } = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const saveKeys = require('./cron');

const app = express();
app.use(express.json());
const port = 5001;

app.get('/', (req, res) => {
  console.log({ req });
  res.json({ message: 'Hello World' });
});

app.post('/me', async (req, res) => {
  // console.log(req.body);

  try {
    const { idToken } = req.body;
    console.log(`${new Date()} --------------------\nverifying token`);
    const { kid, alg, ...rest } = decode(idToken, { complete: true }).header;
    const decoded = decode(idToken, { complete: true });
    if (alg === 'none') throw 'invalid encryption algorithm';

    // read key.json if exist
    const text = await fs
      .readFile(path.join(__dirname, 'key.json'), 'utf8')
      .catch((err) => {
        return saveKeys().then((x) =>
          fs.readFile(path.join(__dirname, 'key.json'), 'utf8')
        );
      });
    let cert = null;
    for (let key of JSON.parse(text).keys) {
      if (
        key.kid !== kid ||
        key.issuer !==
          `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`
      )
        continue;
      cert = key.x5c[0];
      break;
    }

    // get new key from microsoft
    if (!cert) {
      text = await saveKeys().then((x) =>
        fs.readFile(path.join(__dirname, 'key.json'), 'utf8')
      );
      for (let key of JSON.parse(text).keys) {
        if (
          key.kid !== kid ||
          key.issuer !==
            `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`
        )
          continue;
        cert = key.x5c[0];
        break;
      }
      if (!cert) throw 'no matching cert for:\n' + idToken;
    }
    const { aud, iss } = verify(
      idToken,
      `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`,
      { algorithms: [alg] }
    );
    if (
      aud !== process.env.APPLICATION_ID ||
      iss !== `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`
    ) {
      throw 'invalid aud or iss';
    }
    // continue business logic

    res.json({ success: true, data: decoded });
  } catch (err) {
    res.json({ data: err.toString(), success: false });
    // catch the error in whatever way you like
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
