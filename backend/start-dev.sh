#!/bin/bash

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Start the development server
npm run dev