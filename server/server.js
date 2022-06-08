// import express from 'express';
// import { msalConfig } from './authConfig';
// import { verify } from 'jsonwebtoken';
const express = require('express');
const { decode, verify } = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const saveKeys = require('./Cron');

const config = {
  tenantId: '894e76be-7471-4267-8adc-db9395395ea1',
  clientId: '49a86171-bbec-449b-bf4d-8813b48b2285',
}

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
    console.log({ idToken });
    console.log(`${new Date()} --------------------\nverifying token`);
    const { kid, alg, ...rest } = decode(idToken, { complete: true }).header;
    const dc = decode(idToken, { complete: true });
    console.log({dc})
    if (alg === 'none') throw 'invalid encryption algorithm';
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
          `https://login.microsoftonline.com/894e76be-7471-4267-8adc-db9395395ea1/v2.0`
      )
        continue;
      cert = key.x5c[0];
      break;
    }
    if (!cert) {
      text = await saveKeys().then((x) =>
        fs.readFile(path.join(__dirname, 'key.json'), 'utf8')
      );
      for (let key of JSON.parse(text).keys) {
        if (
          key.kid !== kid ||
          key.issuer !==
            `https://login.microsoftonline.com/894e76be-7471-4267-8adc-db9395395ea1/v2.0`
        )
          continue;
        cert = key.x5c[0];
        break;
      }
      if (!cert) throw 'no matching cert for:\n' + idToken;
    }

    console.log({cert})

    const { aud, iss, email, name } = verify(
      idToken,
      `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`,
      { algorithms: [alg] }
    );
    if (
      aud !== '49a86171-bbec-449b-bf4d-8813b48b2285' ||
      iss !== `https://login.microsoftonline.com/894e76be-7471-4267-8adc-db9395395ea1/v2.0`
    ) {
      throw 'invalid aud or iss';
    }
    res.json({ data: {email, name, iss, aud}, success: true });
    // continue with business logic...
  } catch (err) {
    res.json({ data: 'error',  success: false });
    // catch the error in whatever way you like
  }


});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
