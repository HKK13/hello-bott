FROM node:latest

# Create app directory
RUN mkdir -p /src
WORKDIR /src

# Install app dependencies
RUN npm i nodemon -g
COPY package.json /src
RUN npm i

EXPOSE 3000

CMD nodemon index
