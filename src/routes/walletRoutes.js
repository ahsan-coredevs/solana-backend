const express = require('express');
const { getTransactionSignatures } = require('../controllers/getAccountInfo');
const { getTransactionDetails, analyzeTransaction } = require('../controllers/buySell');
const { transactionsDetails, buySell } = require('../controllers/buySellPostPrice');
const router = express.Router();

// Route to fetch transactions by wallet address
router.get('/transactions/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params; // Get wallet address from the route parameter
        const transactions = await getTransactionSignatures(walletAddress); // Fetch transactions using your getTransactionSignatures function
        res.json({
            success: true,
            transactions,
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
            error: error.message,
        });
    }
});

// Route to get transaction details and analyze buy/sell
router.get('/transactions/type/:txSignature', async (req, res) => {
    try {
        const { txSignature } = req.params; // Get transaction signature from the route parameter
        const {userWalletAddress} = req.body;
        const transaction = await getTransactionDetails(txSignature); // Fetch transaction details
        const result = analyzeTransaction(transaction, userWalletAddress); // Analyze buy/sell transaction
        res.json({
            success: true,
            transaction: result,
        });
    } catch (error) {
        console.error('Error analyzing transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze transaction',
            error: error.message,
        });
    }
});

router.get('/transactions/typo/:txSignature', async (req, res) => {
    try {
        const { txSignature } = req.params; // Get transaction signature from the route parameter
        const {userWalletAddress} = req.body;
        const transaction = await transactionsDetails(txSignature); // Fetch transaction details
        const result = buySell(transaction, userWalletAddress); // Analyze buy/sell transaction
        res.json({
            success: true,
            transaction: result,
        });
    } catch (error) {
        console.error('Error analyzing transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze transaction',
            error: error.message,
        });
    }
});

module.exports = router;
