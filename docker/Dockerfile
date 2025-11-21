# Define the base image
FROM node:18

# Set the working directory
WORKDIR /app

# copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./

# install project dependencies
RUN npm install --include=dev --legacy-peer-deps

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# move the container entrypoint into a predictable location
COPY docker/entrypoint.sh /app/entrypoint.sh

EXPOSE 8080

RUN chmod +x /app/entrypoint.sh

# Set the entrypoint script as the entrypoint for this Docker image
ENTRYPOINT ["/app/entrypoint.sh"]
