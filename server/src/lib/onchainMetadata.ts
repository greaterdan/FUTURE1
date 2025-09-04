import { Connection, PublicKey } from "@solana/web3.js";
import { toHttp } from "./offchainMetadata";

// Correct Metaplex Metadata Program ID
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export async function getOnchainMetadata(
  connection: Connection,
  mintStr: string
): Promise<{ name?: string; symbol?: string; uri?: string; image?: string; description?: string }> {
  try {
    const mint = new PublicKey(mintStr);
    
    // Resolve the correct Metaplex metadata PDA
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      METADATA_PROGRAM_ID
    );
    
    const account = await connection.getAccountInfo(pda);
    if (!account) {
      console.log(`No metadata account found for mint: ${mintStr}`);
      return {};
    }
    
    // Use improved manual parsing that's more flexible with metadata layouts
    const metadata = parseMetadataAccount(account.data);
    if (!metadata) {
      console.log(`Failed to parse metadata for mint: ${mintStr}`);
      return {};
    }
    
    // Sanitize the parsed metadata with more lenient validation
    const sanitizedName = sanitizeString(metadata.name);
    const sanitizedSymbol = sanitizeString(metadata.symbol);
    const sanitizedUri = sanitizeUri(metadata.uri);
    
    // If we have a valid URI, try to fetch the JSON metadata
    let jsonMetadata: any = {};
    if (sanitizedUri) {
      jsonMetadata = await safeFetchJson(sanitizedUri) || {};
    } else if (metadata.uri) {
      console.log(`⚠️ URI validation failed for ${mintStr}: "${metadata.uri}" - will try to normalize`);
      // Try to normalize the URI even if it doesn't pass strict validation
      const normalizedUri = normalizeUri(metadata.uri);
      if (normalizedUri !== metadata.uri) {
        jsonMetadata = await safeFetchJson(normalizedUri) || {};
        if (jsonMetadata.name || jsonMetadata.symbol) {
          console.log(`✅ Successfully fetched metadata using normalized URI for ${mintStr}`);
        }
      }
    }
    
    return {
      name: sanitizedName || jsonMetadata.name,
      symbol: sanitizedSymbol || jsonMetadata.symbol,
      uri: sanitizedUri || undefined,
      image: jsonMetadata.image,
      description: jsonMetadata.description
    };
    
  } catch (error) {
    console.error(`Error fetching metadata for mint ${mintStr}:`, error);
    return {};
  }
}

// Improved manual parsing that's more flexible with metadata layouts
function parseMetadataAccount(data: Buffer): { name?: string; symbol?: string; uri?: string } | null {
  try {
    // Skip the first 1 byte (discriminator)
    let offset = 1;
    
    // Read name (32 bytes, null-terminated)
    const nameBytes = data.slice(offset, offset + 32);
    const name = readNullTerminatedString(nameBytes);
    offset += 32;
    
    // Read symbol (10 bytes, null-terminated)
    const symbolBytes = data.slice(offset, offset + 10);
    const symbol = readNullTerminatedString(symbolBytes);
    offset += 10;
    
    // Read URI - be more flexible with the length since some tokens have longer layouts
    // Try different lengths to find the URI
    let uri = '';
    const maxUriLength = Math.min(500, data.length - offset); // More flexible length
    
    for (let uriLength = 200; uriLength <= maxUriLength; uriLength += 50) {
      const uriBytes = data.slice(offset, offset + uriLength);
      const potentialUri = readNullTerminatedString(uriBytes);
      
      // Check if this looks like a valid URI
      if (isValidUri(potentialUri)) {
        uri = potentialUri;
        console.log(`✅ Found valid URI with length ${uriLength} for token`);
        break;
      }
    }
    
    // If no valid URI found with flexible parsing, try the standard 200 bytes
    if (!uri) {
      const uriBytes = data.slice(offset, offset + 200);
      uri = readNullTerminatedString(uriBytes);
    }
    
    return { name, symbol, uri };
  } catch (error) {
    console.error('Error parsing metadata account:', error);
    return null;
  }
}

function readNullTerminatedString(bytes: Buffer): string {
  const nullIndex = bytes.indexOf(0);
  if (nullIndex === -1) return bytes.toString('utf8');
  return bytes.slice(0, nullIndex).toString('utf8');
}

// Check if a string looks like a valid URI
function isValidUri(str: string): boolean {
  if (!str || str.length < 10) return false;
  
  // Check for common URI patterns
  return /^(https?:\/\/|ipfs:\/\/|ar:\/\/|data:)/i.test(str) ||
         str.includes('ipfs') || 
         str.includes('arweave') ||
         str.includes('http');
}

// More lenient URI sanitization that tries to normalize instead of rejecting
function sanitizeUri(uri?: string): string | null {
  if (!uri) return null;
  
  // Clean the URI
  const cleaned = uri.replace(/\0/g, "").trim();
  
  // Hard guard: reject oversized garbage blobs
  if (cleaned.length > 500) { // Increased from 300 to handle longer URIs
    console.log(`⚠️ URI too long (${cleaned.length} chars), rejecting: ${cleaned.substring(0, 50)}...`);
    return null;
  }
  
  // Accept valid URL schemes
  if (/^(https?:\/\/|ipfs:\/\/|ar:\/\/)/i.test(cleaned)) {
    return cleaned;
  }
  
  // Try to normalize IPFS/Arweave URIs that might have query params or non-standard casing
  if (cleaned.includes('ipfs') || cleaned.includes('arweave')) {
    const normalized = normalizeUri(cleaned);
    if (normalized !== cleaned) {
      console.log(`⚠️ Normalized potentially malformed URI: "${cleaned}" -> "${normalized}"`);
      return normalized;
    }
  }
  
  // Try toHttp normalization as a last resort
  const httpNormalized = toHttp(cleaned);
  if (httpNormalized && httpNormalized !== cleaned) {
    console.log(`⚠️ toHttp normalization successful: "${cleaned}" -> "${httpNormalized}"`);
    return httpNormalized;
  }
  
  // Don't reject immediately - let the caller try normalization
  console.log(`⚠️ URI validation failed, but will try normalization: ${cleaned}`);
  return null;
}

// Sanitize name and symbol strings with more lenient validation
function sanitizeString(str?: string): string | null {
  if (!str) return null;
  
  const cleaned = str.replace(/\0/g, "").trim();
  
  // Hard guard: reject oversized garbage blobs
  if (cleaned.length > 200) { // Increased from 100 to handle longer names
    console.log(`⚠️ String too long (${cleaned.length} chars), rejecting: ${cleaned.substring(0, 50)}...`);
    return null;
  }
  
  // More lenient character validation - allow some non-ASCII for international tokens
  if (cleaned.length > 0 && !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(cleaned)) {
    return cleaned;
  }
  
  return null;
}

// Enhanced URI normalization for better compatibility
function normalizeUri(uri: string): string {
  // Use the toHttp function from offchainMetadata for better IPFS/Arweave handling
  const normalized = toHttp(uri);
  if (normalized && normalized !== uri) {
    return normalized;
  }
  
  // Fallback to manual normalization for edge cases
  if (uri.includes('ipfs')) {
    // Extract CID from various IPFS formats
    const ipfsMatch = uri.match(/ipfs[:\/]([a-zA-Z0-9]+)/);
    if (ipfsMatch) {
      const cid = ipfsMatch[1];
      return `https://cloudflare-ipfs.com/ipfs/${cid}`;
    }
  }
  
  // Handle Arweave URIs
  if (uri.includes('arweave') || uri.includes('ar://')) {
    const arMatch = uri.match(/ar[:\/]([a-zA-Z0-9_-]+)/);
    if (arMatch) {
      const id = arMatch[1];
      return `https://arweave.net/${id}`;
    }
  }
  
  // Handle HTTP URLs with query params
  if (uri.startsWith('http')) {
    return uri;
  }
  
  return uri;
}

// Safe fetch wrapper with timeout and error handling
async function safeFetchJson(uri: string): Promise<any | null> {
  try {
    // Use toHttp for better URI normalization
    const normalized = toHttp(uri) || normalizeUri(uri);
    console.log(`Fetching JSON metadata from: ${normalized}`);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(normalized, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Solana-Token-Tracker/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`HTTP ${response.status} for ${normalized}`);
      return null;
    }
    
    const json = await response.json();
    console.log(`Successfully fetched JSON metadata from ${normalized}`);
    return json;
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log(`⚠️ Fetch timeout for ${uri}`);
    } else {
      console.log(`⚠️ Failed fetch for ${uri}:`, error);
    }
    return null;
  }
}



