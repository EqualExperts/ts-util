#!/bin/bash

# script to start a mongodb instance, run the integration tests, build and publish the package

set -e

docker-compose up -d

npm run build

git push

set +e

