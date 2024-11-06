#!/bin/bash
set -ex

# Download poaps
aws s3 cp s3://tlsn-plugin-demo/poaps.txt server/util/

aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 490752553772.dkr.ecr.eu-central-1.amazonaws.com

docker build -t tlsn-plugin-demo .
docker tag tlsn-plugin-demo:latest 490752553772.dkr.ecr.eu-central-1.amazonaws.com/tlsn-plugin-demo:latest
docker push 490752553772.dkr.ecr.eu-central-1.amazonaws.com/tlsn-plugin-demo:latest

exit 0
