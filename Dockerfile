FROM node:16

WORKDIR /code

COPY package.json yarn.lock ./
RUN yarn install

COPY . ./
