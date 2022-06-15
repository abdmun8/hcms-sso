# How to Run App
`Require Node JS 14+`

1. copy .env.example to .env
2. npm install 
3. npm run start
4. App running on port 5001
5. Import below payload to your postman. Open postman import -> raw text -> paste below payload -> continue -> import

## Payload
`Change idToken with your idToken or rawIdToken from azure AD`

``` bash
curl --location --request POST 'http://localhost:5001/me' \
--header 'Content-Type: application/json' \
--data-raw '{
    "idToken": "your idToken here"
}'
```
