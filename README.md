# Budget

This is a simple app to track your spending and monitor transactions in your accounts

## Getting Started

### Installation

1. Clone this repository
2. For the backend, you will need the following available:
   ```sh
   python3 - For running the API
   pip     - For installing the python dependencies
   chrome  - For running the web scrapers
   ```

3. Install all the necessary python dependencies:
   ```sh
   pip install uvicorn[standard] fastapi python-jose[cryptography] passlib python-multipart jinja2 httpx
   ```

4. For the frontend, you will need at least v18 of node install (nvm is recommended).

5. Install the node dependencies with:
   ```sh
   npm install
   ```

### Setup

1. Copy the file `backend/budget.example.json` to `backend/budget.json`, and fill in all the fields:
   - For `access_token_key`/`refresh_token_key`, generate a long (eg. 64 characters) randome hex string
   - For `GCMAPIKey`, enter a Google Cloud API key.
   - For `vapidPublicKey`/`vapidPrivateKey`, you can get a set of key with the following command:
      ```sh
      node -e "const webpush = require('web-push');console.log(webpush.generateVAPIDKeys());"
      ```
   - For `vapidSub`, use your email address
   - For generating a user hash, run the following command (changing "password" to something else):
      ```sh
      python3 -c "from passlib.hash import bcrypt;print(bcrypt.hash('password'))"
      ```
2. Run `make build` to build the frontend.
3. Serve the app using your method of choice (eg. nginx/apache), or simple run uvicorn from the `backend` directory to serve the app. For example:
   ```sh
   cd backend
   DIST_PATH=../dist/ uvicorn api:app --host 127.0.0.1 --ssl-keyfile sslkey.pem --ssl-certfile sslcert.pem --port 8443
   ```
   This will serve the app over HTTPS binding to 127.0.0.1:8443

## License

Distributed under the MIT License. See `LICENSE` for more information.
