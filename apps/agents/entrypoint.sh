#!/bin/bash
# Entrypoint script that chooses between real and mock orchestrator

if [ "$USE_MOCK_ANALYSIS" = "true" ]; then
    echo "DEBUG: Using MOCK orchestrator (no AWS required)" >&2
    exec python agents/orchestrator_mock.py "$@"
else
    echo "DEBUG: Using REAL orchestrator (requires AWS Bedrock)" >&2
    exec python agents/orchestrator.py "$@"
fi
