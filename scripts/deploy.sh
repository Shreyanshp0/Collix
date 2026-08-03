#!/bin/bash

docker compose -f docker-compose.prod.yml up -d --build

docker image prune -f
