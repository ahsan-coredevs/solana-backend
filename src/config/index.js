
require('dotenv').config(); // Load .env file

const SOLANA_RPC_URL = process.env.RPC_HTTPS_MAINNET;
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const PORT = process.env.PORT || 3000;

module.exports = { SOLANA_RPC_URL, MORALIS_API_KEY, PORT };
