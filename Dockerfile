FROM node:21
WORKDIR /usr/src/app
COPY ./package.json .
RUN npm install
COPY . /usr/src/app
EXPOSE 8080
CMD ["npm", "start"]
