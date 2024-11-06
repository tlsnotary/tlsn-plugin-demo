#!/bin/bash
set -ex

tasks="tlsn-plugin-demo"
for task in $tasks; do
  revision=$(aws ecs describe-task-definition --task-definition $task --query "taskDefinition.revision")
  aws ecs update-service --cluster tlsn-plugin-demo --service $task --force-new-deployment --task-definition $task:$revision
done

for loop in {1..3}; do
  [ "$loop" -eq 3 ] && exit 1
  aws ecs wait services-stable --cluster tlsn-plugin-demo --services $tasks && break || continue
done
