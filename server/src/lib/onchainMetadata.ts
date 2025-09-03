import { Connection, PublicKey } from "@solana/web3.js";
import {
  PROGRAM_ID as METADATA_PROGRAM_ID,
  Metadata
} from "@metaplex-foundation/mpl-token-metadata";

export async function getOnchainMetadata(
  connection: Connection,
  mintStr: string
): Promise<{ name?: string; symbol?: string; uri?: string }> {
  const mint = new PublicKey(mintStr);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM_ID
  );
  const account = await connection.getAccountInfo(pda);
  if (!account) return {};
  // mpl-token-metadata v1 API
  const meta = Metadata.deserialize(account.data)[0];
  const clean = (s?: string) => (s ? s.replace(/\0/g, "").trim() : undefined);
  return {
    name: clean(meta.data.name),
    symbol: clean(meta.data.symbol),
    uri: clean(meta.data.uri),
  };
}
