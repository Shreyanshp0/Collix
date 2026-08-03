#!/bin/bash

set -euo pipefail

cd /opt/collix

IMAGE_TAG="${1:?Usage: $0 <previous-image-tag>}"
export IMAGE_TAG

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
