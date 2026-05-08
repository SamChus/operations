# --- First Stage ---

# 1. Ensure 'AS builder' 
FROM node:24-alpine AS builder 

#create app directory and set it as the working directory
WORKDIR /home/app

#copy package.json and install dependencies first to leverage Docker cache
COPY server/package.json ./

#install dependencies
RUN npm install

#copy the rest of the application code to the working directory
COPY . .

# --- Second Stage ---
FROM node:24-alpine


#create app directory and set it as the working directory
WORKDIR /home/app

#copy 
COPY --from=builder /home/app/node_modules ./node_modules

#copy the server code and other necessary files from the builder stage to the final image
COPY --from=builder /home/app/server ./server

#copy package.json to the root of the final image for potential use in scripts or future dependency management 
COPY --from=builder /home/app/package.json ./

USER node
CMD [ "node", "server/index.js" ]           

#COPY <source> <destination>
