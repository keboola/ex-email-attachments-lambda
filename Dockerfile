FROM node:16

WORKDIR /code

RUN npm install -g serverless@3.38

COPY package.json yarn.lock ./
RUN yarn install

COPY . ./
