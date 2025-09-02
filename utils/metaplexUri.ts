import { PublicKey, Connection } from "@solana/web3.js";

const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export async function fetchMetaplexUriDirect(mint: string, connection: Connection) {
  try {
    const mintPk = new PublicKey(mint);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mintPk.toBuffer()],
      METADATA_PROGRAM_ID
    );
    const info = await connection.getAccountInfo(pda);
    if (!info) return;
    
    // Minimal decode: uri is a fixed-length, null-padded string near the end for v1 accounts.
    // Search for the first valid URL in the data:
    const data = info.data;
    const text = new TextDecoder().decode(data);
    const m = text.match(/https?:\/\/[^\s"]+/);
    return m?.[0]?.replace(/\0+$/, "");
  } catch { 
    /* ignore */ 
  }
}

