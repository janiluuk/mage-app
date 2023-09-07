#!/bin/sh

# navigate to the application directory
cd /app

# Load the environment variables
export $(egrep -v '^#' .env | xargs)

# start the application in development mode
npm run dev


