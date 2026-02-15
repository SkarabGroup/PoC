
# Agents

## Overview
This directory contains the agent orchestration system for the SWEP PoC project.

## Structure

- **orchestrator.py** - Main orchestrator for managing agent workflows
- **spellAgent.py** - Agent implementation for spell-related operations
- **tools/** - Shared tools and utilities for agents
    - `orchestratorTools.py` - Orchestrator-specific tools
    - `spellAgentTools.py` - Spell agent tools
- **database/** - Database management and queries

## Setup

1. Copy `.env.example` to `.env` and configure your environment variables

## Docker

Build the agents container:
```bash
docker build -t *YOUR_NAME_FOR_IMAGE* -f Dockerfile.agents . 
```
Run the agents container:
```bash
docker run --rm --env-file .env *YOUR_NAME_FOR_IMAGE* *REPO_NAME* *DESTINATION_OF_THE_CLONED_REPO*
```
