const fetch = require("node-fetch");
const { Connection, clusterApiUrl, PublicKey } = require("@solana/web3.js");

const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";  // Using Solana Mainnet RPC

// DEX Program IDs (updated)
const DEX_PROGRAM_IDS = {
    "Raydium": [
        "9xQeWvGNBgiMqqBts84y5RvHpGfKD6LvAs59AsM9yJ4",
        "RVKd61ztZW9m6EL6u3XJicdyhZpA9xUm61bEcjMmphj",
        "Cmdd7vZtJ7ntP3mFVH5iFS4RZ3PuvqVjFtpcvBP7cwJ1"
    ],
    "Serum": ["9xQeWvGNBgiMqqBts84y5RvHpGfKD6LvAs59AsM9yJ4"],
    "Jupiter": ["JUP4Fb2cYiPXwb8kNUtUGm6eUJ34UTn3c3d2Ju3ZEVh"],
    "Orca": [
        "9W8MEPrcApqkXzEj6KoNZLDJHDBQjEJ1Vj4i7pZ5hVwR",
        "npr8uWk5D9PbPm4XTEQBdK3w3JGf4roM4fdGoofwaE5"
    ],
    "Saber": ["SaberV7vKnNcFXUzq5sJTx3dPZL9qrEN2hN6SktzYg"],
    "Lifinity": [
        "A2PbpRfRFwKpRBLzyzZmL6mh69qg9NDVSKyByuJb6BY",
        "A6YJ6csMo9iWeq9t47kuykkAtDQ1MrfUShVxY2RHfow"
    ],
    "Meteora": ["9vYWH5LSbbmLJFaPQU7jDXiwT2tExz7t4hzHd2vPmKw"],
    "Crema": ["CrembEvk1cBpGLs2wv4pRteBjD2j4p8ceJ25DsvZx2B"],
    "GooseFX": ["GFXe8LUT3z3ug7sJghyAwGh7z5GztkMoHRTG7R9D7pUM"],
    "Aldrin": ["ALdx8okGoM9gPDPCU8jJwRZmpdCi3ZMtXb93CsdzX8gV"],
    "OpenBook": [
        "11111111111111111111111111111111",
        "srm6x5eiHDbX32Wx1RnvGZ3xuSovWyw3Wa2iy4ZBBuX"
    ]
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

async function extractTransactionDetails(transactionData) {
    if (!transactionData || !transactionData.meta || !transactionData.transaction) {
        throw new Error("Invalid transaction data");
    }

    const { signatures, meta, transaction, blockTime } = transactionData;
    const { fee, preBalances = [], postBalances = [], preTokenBalances = [], postTokenBalances = [] } = meta;
    const { message } = transaction;
    const { instructions } = message;

    const signature = message.signatures?.[0] || "N/A";
    const transactionDate = blockTime ? new Date(blockTime * 1000).toISOString() : "N/A";
    
    // Find first transfer instruction (if exists)
    const transferInstruction = instructions.find(inst => inst?.parsed?.type === "transfer");
    const transferAmount = transferInstruction?.parsed?.info?.amount || "N/A";
    const programId = transferInstruction?.programId?.toString() || "N/A";

    // Get token address (handles multiple tokens)
    const tokenAddress = preTokenBalances[0]?.mint || postTokenBalances[0]?.mint || "N/A";

    // Calculate priority fee (assumed to be the total transaction fee)
    const priorityFee = fee || 0;

    // Get min pre/post balance and total SOL balance
    const preBalanceMin = preBalances.length ? Math.min(...preBalances) : 0;
    const postBalanceMin = postBalances.length ? Math.min(...postBalances) : 0;
    const totalSol = postBalances.reduce((total, balance) => total + balance, 0);

    return {
        signature,
        transferAmount,
        fee,
        programId,
        transactionDate,
        priorityFee,
        tokenAddress,
        preBalanceMin,
        postBalanceMin,
        totalSol
    };
}

const connection = new Connection(clusterApiUrl("mainnet-beta"));

async function getTransactions(walletAddress) {
    const pubKey = new PublicKey(walletAddress);
    const transactions = await connection.getSignaturesForAddress(pubKey, { limit: 5 });
   return transactions;
}



// Function to analyze transaction (Detects buy/sell actions)
function buySell(transaction, userWalletAddress) {
    if (!transaction) return "Invalid transaction or not found.";
    
    // console.log("Full Transaction Data:", JSON.stringify(transaction, null, 2));

    const instructions = transaction?.transaction?.message?.instructions || [];
    const innerInstructions = transaction?.meta?.innerInstructions || [];
    
    console.log("Instructions:", JSON.stringify(instructions, null, 2));
    // console.log("Inner Instructions:", JSON.stringify(innerInstructions, null, 2));

    let dexUsed = [];
    let tokenTransfers = [];

    const allInstructions = [...instructions, ...innerInstructions.flatMap(i => i.instructions)];

    allInstructions.forEach(instruction => {
        // console.log("Instruction Data:", JSON.stringify(instruction, null, 2));
        
        const programId = instruction?.programId?.toString();
        const programIdIndex = instruction?.programIdIndex;

        if (programId && Object.values(DEX_PROGRAM_IDS).flat().includes(programId)) {
            dexUsed.push(programId);
        }
        if (programIdIndex !== undefined) {
            const accountKeys = transaction.transaction.message.accountKeys || [];
            if (accountKeys[programIdIndex]) {
                const resolvedProgramId = accountKeys[programIdIndex];
                if (Object.values(DEX_PROGRAM_IDS).flat().includes(resolvedProgramId)) {
                    dexUsed.push(resolvedProgramId);
                }
            }
        }
    });

    console.log("DEX Used:", dexUsed);

    const preBalances = transaction.meta.preTokenBalances || [];
    const postBalances = transaction.meta.postTokenBalances || [];
    
    console.log("Pre Balances:", JSON.stringify(preBalances, null, 2));
    console.log("Post Balances:", JSON.stringify(postBalances, null, 2));

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

    // console.log("Token Changes:", JSON.stringify(tokenChanges, null, 2));

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

module.exports = { transactionsDetails, buySell, extractTransactionDetails, getTransactions };