const { Connection, PublicKey } = require('@solana/web3.js');

// Initialize connection to Solana mainnet
const connection = new Connection('https://api.mainnet-beta.solana.com');

/**
 * Fetch account information for a given wallet address.
 * @param {string} walletAddress - The wallet address to query.
 * @returns {Promise<Object>} - Account information.
 */
async function getAccountInfo(walletAddress) {
  const publicKey = new PublicKey(walletAddress);
  const accountInfo = await connection.getAccountInfo(publicKey);
  return accountInfo;
}

/**
 * Fetch the balance of a given wallet address.
 * @param {string} walletAddress - The wallet address to query.
 * @returns {Promise<number>} - Balance in lamports.
 */
async function getBalance(walletAddress) {
  const publicKey = new PublicKey(walletAddress);
  const balance = await connection.getBalance(publicKey);
  return balance;
}

/**
 * Fetch transaction signatures for a given wallet address.
 * @param {string} walletAddress - The wallet address to query.
 * @param {number} limit - Maximum number of transactions to fetch.
 * @returns {Promise<Array>} - List of transaction signatures.
 */
async function getTransactionSignatures(walletAddress, limit = 100) {
  const publicKey = new PublicKey(walletAddress);
  const signatures = await connection.getSignaturesForAddress(publicKey, { limit });
  return signatures;
}

/**
 * Fetch full transaction details for a given transaction signature.
 * @param {string} signature - The transaction signature to query.
 * @returns {Promise<Object>} - Transaction details.
 */
async function getTransactionDetails(signature) {
  const transaction = await connection.getTransaction(signature);
  return transaction;
}

/**
 * Fetch token account balance for a given wallet address.
 * @param {string} walletAddress - The wallet address to query.
 * @returns {Promise<Object>} - Token account balance.
 */
async function getTokenAccountBalance(walletAddress) {
  const publicKey = new PublicKey(walletAddress);
  const tokenBalance = await connection.getTokenAccountBalance(publicKey);
  return tokenBalance.value;
}

/**
 * Fetch all token accounts owned by a given wallet address.
 * @param {string} walletAddress - The wallet address to query.
 * @returns {Promise<Array>} - List of token accounts.
 */
async function getTokenAccountsByOwner(walletAddress) {
  const publicKey = new PublicKey(walletAddress);
  const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token Program
  });
  return tokenAccounts.value;
}

/**
 * Fetch the current slot number.
 * @returns {Promise<number>} - Current slot number.
 */
async function getCurrentSlot() {
  const slot = await connection.getSlot();
  return slot;
}

/**
 * Fetch the latest blockhash.
 * @returns {Promise<Object>} - Latest blockhash and last valid block height.
 */
async function getLatestBlockhash() {
  const blockhash = await connection.getLatestBlockhash();
  return blockhash;
}

/**
 * Fetch the current epoch information.
 * @returns {Promise<Object>} - Epoch information.
 */
async function getEpochInfo() {
  const epochInfo = await connection.getEpochInfo();
  return epochInfo;
}

// Export all functions
module.exports = {
  getAccountInfo,
  getBalance,
  getTransactionSignatures,
  getTransactionDetails,
  getTokenAccountBalance,
  getTokenAccountsByOwner,
  getCurrentSlot,
  getLatestBlockhash,
  getEpochInfo,
};