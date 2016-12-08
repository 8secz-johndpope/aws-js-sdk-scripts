#!/usr/bin/env bash

if  node -v > /dev/null 
then
  echo "node is installed, skipping..."
else
  curl --silent --location https://rpm.nodesource.com/setup_6.x | sudo  bash -
  sudo yum -y install nodejs
fi

npm install
