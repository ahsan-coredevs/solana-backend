const { Connection, PublicKey } = require('@solana/web3.js');

// Utility function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to fetch transactions with retries and exponential backoff
async function fetchWithRetry(connection, signature, retries = 5, delayMs = 1000) {
  try {
    const transaction = await connection.getTransaction(signature);
    return transaction;
  } catch (error) {
    if (retries === 0) throw error; // No more retries left
    console.log(`Retrying fetch for signature ${signature} in ${delayMs}ms...`);
    await delay(delayMs); // Wait before retrying
    return fetchWithRetry(connection, signature, retries - 1, delayMs * 2); // Exponential backoff
  }
}

async function getWalletTransactions(walletAddress) {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const publicKey = new PublicKey(walletAddress);

  try {
    // Fetch transaction signatures for the wallet
    const transactionSignatures = await connection.getConfirmedSignaturesForAddress2(publicKey, {
      limit: 100, // Adjust limit as needed
    });

    // Fetch full transaction details for each signature with rate limiting
    const transactions = [];
    for (const tx of transactionSignatures) {
      try {
        const transaction = await fetchWithRetry(connection, tx.signature);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.error(`Failed to fetch transaction ${tx.signature}:`, error);
      }
      await delay(500); // Add a delay between requests to avoid rate limiting
    }

    // Filter transactions from the last 90 days
    const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const ninetyDaysAgo = now - 1 * 24 * 60 * 60;

    const recentTransactions = transactions.filter((tx) => {
      return tx.blockTime >= ninetyDaysAgo;
    });

    return recentTransactions;
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    throw error;
  }
}

// Export the function
module.exports = getWalletTransactions;