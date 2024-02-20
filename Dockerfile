FROM node:21
WORKDIR /usr/src/app
COPY ./package.json .
RUN npm install
COPY . /usr/src/app
# COPY ./ais-listener-service-account.json /root
# ENV GOOGLE_APPLICATION_CREDENTIALS=/root/ais-listener-service-account.json
# COPY src .
# CMD ["npm", "start"]
CMD ["npm", "start"]
