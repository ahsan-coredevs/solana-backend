const { getSolBalance, getTokenHoldings } = require('../services/solanaService');

// Controller to get SOL balance of a wallet
const getWalletBalance = async (req, res, next) => {
  try {
    const walletAddress = req.params.walletAddress;
    const balance = await getSolBalance(walletAddress);
    res.json({ success: true, data: balance });
  } catch (error) {
    next(error); // Pass the error to the global error handler
  }
};

// Controller to get tokens held by a wallet
const getWalletTokens = async (req, res, next) => {
  try {
    const walletAddress = req.params.walletAddress;
    const tokens = await getTokenHoldings(walletAddress);
    res.json({ success: true, data: tokens });
  } catch (error) {
    next(error); // Pass the error to the global error handler
  }
};


module.exports = { getWalletBalance, getWalletTokens };
