#!/bin/bash

# Set environment variables
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=099d5df1-149d-445e-b861-7269571c1804"
export HELIUS_API_KEY="099d5df1-149d-445e-b861-7269571c1804"
export BIRDEYE_API_KEY="test"
export PORT=8080
export NODE_ENV=development

# Start the server
npm start
