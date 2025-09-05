const { Connection, PublicKey } = require('@solana/web3.js');

const RPC_ENDPOINT = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
  : "https://mainnet.helius-rpc.com/?api-key=your_helius_api_key_here";
const PUMP_FUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

async function debugDetection() {
  console.log("🔍 DEBUGGING TOKEN DETECTION LOGIC...");
  
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  
  // Test our exact detection logic
  const subscriptionId = connection.onLogs(
    new PublicKey(PUMP_FUN_PROGRAM_ID),
    (logs) => {
      console.log(`\n🎯 TRANSACTION DETECTED: ${logs.signature.slice(0, 16)}...`);
      console.log(`   Logs: ${logs.logs.length} messages`);
      
      // Test our EXACT detection logic from the hook
      const hasNewCoin = logs.logs.some(log => 
        log.includes("Instruction: Create") || 
        log.includes("Program log: Create") ||
        log.includes("CreateEvent") || 
        log.includes("create") ||
        log.includes("new coin") ||
        log.includes("bonding curve")
      );
      
      const hasCreateInstruction = logs.logs.some(log => 
        log.includes("Instruction: Create")
      );
      
      console.log(`   hasNewCoin: ${hasNewCoin}`);
      console.log(`   hasCreateInstruction: ${hasCreateInstruction}`);
      
      if (hasCreateInstruction) {
        console.log("🎉 CREATE INSTRUCTION FOUND!");
        
        // Show the exact log that triggered it
        logs.logs.forEach((log, i) => {
          if (log.includes("Instruction: Create")) {
            console.log(`   📝 Log ${i}: ${log}`);
          }
        });
        
        // Try to extract mint addresses
        const mintAddresses = new Set();
        
        for (const log of logs.logs) {
          const patterns = [
            /([A-Za-z0-9]{32,44})\s+CreateEvent/,
            /CreateEvent\s+([A-Za-z0-9]{32,44})/,
            /([A-Za-z0-9]{32,44})\s+create/,
            /create\s+([A-Za-z0-9]{32,44})/,
            /mint\s+([A-Za-z0-9]{32,44})/,
            /([A-Za-z0-9]{32,44})\s+mint/,
            /Program data:\s+([A-Za-z0-9]{32,44})/,
            /([A-Za-z0-9]{32,44})\s+Program data:/
          ];
          
          for (const pattern of patterns) {
            const match = log.match(pattern);
            if (match) {
              mintAddresses.add(match[1]);
            }
          }
        }
        
        if (mintAddresses.size > 0) {
          console.log(`   🎯 Found ${mintAddresses.size} mint addresses:`, Array.from(mintAddresses));
        } else {
          console.log("   ❌ No mint addresses found with patterns, trying base58 extraction...");
          
          // Try base58 extraction
          for (const log of logs.logs) {
            const base58Pattern = /([1-9A-HJ-NP-Za-km-z]{32,44})/g;
            const matches = log.match(base58Pattern);
            if (matches) {
              matches.forEach(match => {
                if (!match.includes("111111111111111111111111111111") && 
                    !match.includes("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") &&
                    !match.includes("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")) {
                  mintAddresses.add(match);
                  console.log(`   🔍 Potential mint address: ${match}`);
                }
              });
            }
          }
        }
        
        console.log(`   📊 Final mint addresses found: ${mintAddresses.size}`);
      }
    }
  );
  
  console.log(`✅ Debug subscription started (ID: ${subscriptionId})`);
  console.log("⏳ Monitoring for Create instructions... (Press Ctrl+C to stop)");
  
  process.on('SIGINT', () => {
    console.log("\n🛑 Stopping debug monitoring...");
    connection.removeOnLogsListener(subscriptionId);
    process.exit(0);
  });
}

debugDetection();
