const { Connection, PublicKey } = require("@solana/web3.js");
const dotenv = require("dotenv");

dotenv.config();

/**
 * Fetch transactions for a given Solana wallet address within the last `days` days.
 *
 * @param {string} walletAddress - The Solana wallet address.
 * @param {number} days - Number of past days to fetch transactions (default: 90).
 * @returns {Promise<Array>} - Array of transactions.
 */
async function userTransactions(walletAddress, days = 90) {
  if (!process.env.QUICKNODE_URL) {
    throw new Error("Missing QUICKNODE_URL in .env file");
  }

  const connection = new Connection(process.env.QUICKNODE_URL, "confirmed");
  const publicKey = new PublicKey(walletAddress);

  const now = Math.floor(Date.now() / 1000);
  const nDaysAgo = now - days * 24 * 60 * 60;

  let transactions = [];
  let beforeSignature = null;

  try {
    while (true) {
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        before: beforeSignature,
      });

      if (signatures.length === 0) break;

      const filtered = signatures.filter(
        (tx) => tx.blockTime && tx.blockTime >= nDaysAgo
      );

      transactions.push(...filtered);

      const oldestBlockTime = signatures[signatures.length - 1]?.blockTime || 0;
      if (oldestBlockTime < nDaysAgo) break;

      beforeSignature = signatures[signatures.length - 1].signature;
    }

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
}

module.exports = userTransactions;
