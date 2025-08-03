#!/bin/bash
set -e

echo "Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps

echo "Building frontend..."
npm run build

echo "Build completed successfully!"