require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

/**
 * Gets the public key (JWK) for my tenant
 * @returns {Promise}
 */
const saveKeys = () =>
  import('node-fetch')
    .then(({ default: fetch }) =>
      fetch(
        `https://login.microsoftonline.com/${process.env.TENANT_ID}/discovery/v2.0/keys`,
        {
          method: 'GET',
        }
      )
    )
    .then((response) => response.text())
    .then((text) => {
      return fs.writeFile(path.join(__dirname, 'key.json'), text, 'utf8');
    })
    .catch(console.log);

// A reasonable frequency to check for updates to the public keys used by Azure AD is every 24 hours.
cron.schedule('0 18 * * *', saveKeys);

module.exports = saveKeys;
