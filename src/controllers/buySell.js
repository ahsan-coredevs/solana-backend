const fetch = require("node-fetch");

const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";  // Using Solana Mainnet RPC

// DEX Program IDs (updated)
const DEX_PROGRAM_IDS = {
    "Raydium": "9xQeWvGNBgiMqqBts84y5RvHpGfKD6LvAs59AsM9yJ4", 
    "Serum": "9xQeWvGNBgiMqqBts84y5RvHpGfKD6LvAs59AsM9yJ4", 
    "Jupiter": "JUP4Fb2cYiPXwb8kNUtUGm6eUJ34UTn3c3d2Ju3ZEVh"
};

// Function to fetch transaction details from Solana RPC
async function getTransactionDetails(txSignature) {
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
            txSignature, 
            { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }  // Add maxSupportedTransactionVersion
        ]
    };

    const response = await fetch(SOLANA_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Handle errors properly
    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.result || {};
}

// Function to analyze transaction (Detects buy/sell actions)
function analyzeTransaction(transaction, userWalletAddress) {
    if (!transaction) return "Invalid transaction or not found.";

    const instructions = transaction?.transaction?.message?.instructions || [];
    const innerInstructions = transaction?.meta?.innerInstructions || [];


    let dexUsed = null;
    let tokenTransfers = [];

    // Extract all program IDs from outer and inner instructions
    const allInstructions = [...instructions, ...innerInstructions.flatMap(i => i.instructions)];

    allInstructions.forEach(instruction => {

        // Extract programId safely
        const programId = instruction?.programId?.toString();
        const programIdIndex = instruction?.programIdIndex;  // This might be needed if using indexes

        console.log(`Checking Program ID: ${programId} | Index: ${programIdIndex}`);

        // Match programId against known DEX programs
        if (programId && Object.values(DEX_PROGRAM_IDS).includes(programId)) {
            dexUsed = programId;
            console.log(`DEX Detected: ${programId}`);
        }

        // Sometimes, programIdIndex needs to be resolved (depends on Solana's architecture)
        if (programIdIndex !== undefined) {
            const accountKeys = transaction?.transaction?.message?.accountKeys || [];
            if (accountKeys[programIdIndex]) {
                const resolvedProgramId = accountKeys[programIdIndex];
                console.log(`Resolved Program ID: ${resolvedProgramId}`);

                if (Object.values(DEX_PROGRAM_IDS).includes(resolvedProgramId)) {
                    dexUsed = resolvedProgramId;
                    console.log(`DEX Detected (via Index): ${resolvedProgramId}`);
                }
            }
        }

        // Extract token transfer details
        const parsedInfo = instruction?.parsed?.info;
        if (parsedInfo) {
            console.log("Parsed Info:", parsedInfo);
        }

        if (parsedInfo?.source && parsedInfo?.destination && parsedInfo?.tokenAmount?.amount) {
            tokenTransfers.push(parsedInfo);
            console.log("tokentransfer", tokenTransfers)
        }
    });

    if (!dexUsed) {
        console.log("Transaction is not a trade or DEX action.");
        // return "Transaction is not a trade or DEX action.";
    }

    console.log("Detected Token Transfers:", tokenTransfers);

    // Check for buy/sell actions
    for (let transfer of tokenTransfers) {
        const { source, destination, tokenAmount} = transfer;

        console.log(`Transfer Details: Source: ${source}, Destination: ${destination}, Amount: ${tokenAmount.amount}`);

        if (source === userWalletAddress){
            return `SELL Transaction: Sent ${tokenAmount.amount} tokens to ${destination}`;
        } else if (destination === userWalletAddress) {
            return `BUY Transaction: Received ${tokenAmount.amount} tokens from ${source}`;
        }
    }

    return "Transaction detected but could not determine buy/sell.";
}



module.exports = { getTransactionDetails, analyzeTransaction };
