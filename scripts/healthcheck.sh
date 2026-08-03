#!/bin/bash

set -euo pipefail

HEALTH_URL="${HEALTH_URL:-http://localhost/api/v1/health}"
curl --fail --silent --show-error --retry 12 --retry-delay 5 "$HEALTH_URL" | grep -Eq '"success"[[:space:]]*:[[:space:]]*true.*"status"[[:space:]]*:[[:space:]]*"healthy"'
