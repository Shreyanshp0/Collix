#!/bin/bash

docker compose -f docker/compose/docker-compose.prod.yml pull

docker compose -f docker/compose/docker-compose.prod.yml up -d

docker image prune -f