FROM node:16-alpine3.15

LABEL title="twitch-icon-cache docker server"
LABEL version="1.0"

COPY start.sh /

RUN \
  apk add --no-cache \
    git openssh && \
  npm install -g serve


RUN \
  mkdir /app && \
  chown -R node:node /app && \
  chmod +x /start.sh

USER node

RUN \
  cd /app && \
  git config --global init.defaultBranch main && \
  git init && \
  git remote add origin https://github.com/k123s456h/twitch-icon-cache.git 

EXPOSE 32189 
WORKDIR /app

ENTRYPOINT ["/start.sh"]
