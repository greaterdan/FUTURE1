#!/bin/bash

# Set environment variables
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}"
export HELIUS_API_KEY="${HELIUS_API_KEY:-your_helius_api_key_here}"
export BIRDEYE_API_KEY="${BIRDEYE_API_KEY:-your_birdeye_api_key_here}"
export PORT=8080
export NODE_ENV=development

# Start the server
npm start
