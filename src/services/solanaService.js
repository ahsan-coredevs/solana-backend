const { Connection, PublicKey } = require('@solana/web3.js');
const { SOLANA_RPC_URL } = require('../config'); // Import RPC URL

// Connect to Solana blockchain
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Function to fetch SOL balance of a wallet
const getSolBalance = async (walletAddress) => {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return { solBalance: balance / 1e9 }; // Convert lamports to SOL
  } catch (error) {
    throw new Error('Failed to fetch wallet balance');
  }
};

// Function to fetch token holdings of a wallet (SPL tokens)
const getTokenHoldings = async (walletAddress) => {
  try {
    const publicKey = new PublicKey(walletAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: PublicKey.findProgramAddressSync([Buffer.from('Token')])[0], // Token program
    });
    const tokens = tokenAccounts.value.map((account) => ({
      mintAddress: account.account.data.parsed.info.mint,
      amount: account.account.data.parsed.info.tokenAmount.uiAmount,
    }));
    return tokens;
  } catch (error) {
    throw new Error('Failed to fetch token holdings');
  }
};

module.exports = { getSolBalance, getTokenHoldings };
