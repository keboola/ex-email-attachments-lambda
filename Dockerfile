FROM node:16

WORKDIR /code

RUN npm install -g serverless@2.48

COPY package.json yarn.lock ./
RUN yarn install

COPY . ./
