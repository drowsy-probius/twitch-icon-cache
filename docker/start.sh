#!/bin/sh

# export TWITCH_ICON_CACHE_HOST=0.0.0.0
# export TWITCH_ICON_CACHE_CACHE_TIME=2w

cd /app 

echo "$(id)"
echo "$(realpath .)"
echo "$(ls -alh)"

if [ ! -d .git ]; then
  git init
  git remote add origin https://github.com/k123s456h/twitch-icon-cache.git
fi

rm -rf dist
git pull origin main
npm install
npm run build
npm run start
