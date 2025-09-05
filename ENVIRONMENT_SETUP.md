# 🔑 Environment Variables Setup

## Quick Setup

1. **Copy the environment template:**
   ```bash
   cp env-template.txt .env.local
   ```

2. **Edit `.env.local` with your actual API keys:**
   ```bash
   nano .env.local
   # or
   code .env.local
   ```

3. **Add your API keys:**
   - Replace `your_xai_api_key_here` with your actual XAI API key
   - Replace `your_helius_api_key_here` with your actual Helius API key
   - Replace `your_birdeye_api_key_here` with your actual Birdeye API key
   - Replace `your_jupiter_api_key_here` with your actual Jupiter API key

## Required API Keys

### 🚀 **XAI API Key (REQUIRED for AI Chat)**
- **Purpose**: Powers the Grok AI chat functionality
- **Get it**: [XAI Console](https://console.x.ai/)
- **Environment Variable**: `NEXT_PUBLIC_XAI_API_KEY`

### 🌐 **Helius API Key (REQUIRED for Solana)**
- **Purpose**: Solana blockchain RPC access
- **Get it**: [Helius Dashboard](https://dashboard.helius.dev/)
- **Environment Variables**: 
  - `HELIUS_API_KEY`
  - `NEXT_PUBLIC_HELIUS_API_KEY`
  - `HELIUS_RPC_URL`

### 📊 **Birdeye API Key (OPTIONAL)**
- **Purpose**: Market data and price information
- **Get it**: [Birdeye API](https://birdeye.so/)
- **Environment Variables**: 
  - `BIRDEYE_API_KEY`
  - `NEXT_PUBLIC_BIRDEYE_API_KEY`

### 🔄 **Jupiter API Key (OPTIONAL)**
- **Purpose**: DEX aggregator for trading
- **Get it**: [Jupiter Station](https://station.jup.ag/)
- **Environment Variables**: 
  - `JUPITER_API_KEY`
  - `NEXT_PUBLIC_JUPITER_API_KEY`

## Security Notes

- ✅ **Never commit `.env.local` to git** - it's already in `.gitignore`
- ✅ **Use different keys for development and production**
- ✅ **Rotate your API keys regularly**
- ✅ **Monitor your API usage and costs**

## Troubleshooting

### "API Key not found" errors
- Check that your `.env.local` file exists
- Verify the environment variable names match exactly
- Restart your development server after changing environment variables

### "Invalid API key" errors
- Verify your API key is correct
- Check if your API key has the required permissions
- Ensure your API key is active and not expired

### Environment variables not loading
- Make sure you're using `.env.local` (not `.env`)
- Restart your development server
- Check for typos in variable names

## Development vs Production

### Development
- Use `.env.local` for local development
- API keys are loaded automatically by Next.js

### Production
- Set environment variables in your hosting platform
- For Vercel: Use the Environment Variables section in your project settings
- For other platforms: Follow their environment variable setup guide

## Example `.env.local` file

```bash
# XAI API Key (REQUIRED)
NEXT_PUBLIC_XAI_API_KEY=xai-1234567890abcdef

# Helius API Key (REQUIRED)
HELIUS_API_KEY=099d5df1-149d-445e-b861-7269571c1804
NEXT_PUBLIC_HELIUS_API_KEY=099d5df1-149d-445e-b861-7269571c1804
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=099d5df1-149d-445e-b861-7269571c1804

# Birdeye API Key (OPTIONAL)
BIRDEYE_API_KEY=d3bc5f96f223472bb4cc32273fd47d0c
NEXT_PUBLIC_BIRDEYE_API_KEY=d3bc5f96f223472bb4cc32273fd47d0c

# Jupiter API Key (OPTIONAL)
JUPITER_API_KEY=your_jupiter_key_here
NEXT_PUBLIC_JUPITER_API_KEY=your_jupiter_key_here

# Server Configuration
PORT=8080
NODE_ENV=development
```

---

**🎉 Once you've set up your environment variables, your FUTURE project will be ready to use all its features!**
