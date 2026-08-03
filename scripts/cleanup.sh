#!/bin/bash

set -euo pipefail

docker image prune -f
docker container prune -f
docker builder prune -f
