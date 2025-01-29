const fetch = require("node-fetch");

const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";  // Using Solana Mainnet RPC

// DEX Program IDs (updated)
const DEX_PROGRAM_IDS = {
    "Raydium": "9xQeWvGNBgiMqqBts84y5RvHpGfKD6LvAs59AsM9yJ4", 
    "Serum": "9xQeWvGNBgiMqqBts84y5RvHpGfKD6LvAs59AsM9yJ4", 
    "Jupiter": "JUP4Fb2cYiPXwb8kNUtUGm6eUJ34UTn3c3d2Ju3ZEVh"
};

// Function to fetch transaction details from Solana RPC
async function transactionsDetails(txSignature) {
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
            txSignature, 
            { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }
        ]
    };

    const response = await fetch(SOLANA_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }
    return data.result || {};
}

// Function to analyze transaction (Detects buy/sell actions)
function buySell(transaction, userWalletAddress) {
    if (!transaction || !transaction.meta) return "Invalid transaction or not found.";

    const instructions = transaction.transaction.message.instructions || [];
    const innerInstructions = transaction.meta.innerInstructions || [];
    let dexUsed = null;
    let tokenTransfers = [];

    // Extract all program IDs from outer and inner instructions
    const allInstructions = [...instructions, ...innerInstructions.flatMap(i => i.instructions)];
    allInstructions.forEach(instruction => {
        const programId = instruction?.programId?.toString();
        const programIdIndex = instruction?.programIdIndex;

        if (programId && Object.values(DEX_PROGRAM_IDS).includes(programId)) {
            dexUsed = programId;
        }
        if (programIdIndex !== undefined) {
            const accountKeys = transaction.transaction.message.accountKeys || [];
            if (accountKeys[programIdIndex]) {
                const resolvedProgramId = accountKeys[programIdIndex];
                if (Object.values(DEX_PROGRAM_IDS).includes(resolvedProgramId)) {
                    dexUsed = resolvedProgramId;
                }
            }
        }
    });

    

    // Detect buy/sell by checking pre and post token balances
    const preBalances = transaction.meta.preTokenBalances || [];
    const postBalances = transaction.meta.postTokenBalances || [];
    let tokenChanges = {};

    preBalances.forEach(balance => {
        if (balance.owner === userWalletAddress) {
            tokenChanges[balance.mint] = { before: balance.uiTokenAmount.uiAmount, after: 0 };
        }
    });
    postBalances.forEach(balance => {
        if (balance.owner === userWalletAddress) {
            if (tokenChanges[balance.mint]) {
                tokenChanges[balance.mint].after = balance.uiTokenAmount.uiAmount;
            } else {
                tokenChanges[balance.mint] = { before: 0, after: balance.uiTokenAmount.uiAmount };
            }
        }
    });

    for (let mint in tokenChanges) {
        let { before, after } = tokenChanges[mint];
        if (after > before) {
            return `BUY Transaction: Received ${after - before} tokens of ${mint}`;
        } else if (before > after) {
            return `SELL Transaction: Sent ${before - after} tokens of ${mint}`;
        }
    }

    return "Transaction detected but could not determine buy/sell.";
}

module.exports = { transactionsDetails, buySell };