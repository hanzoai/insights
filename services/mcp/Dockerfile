# Use a lightweight Node.js image
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install mcp-remote globally to avoid npx overhead on each run
RUN npm install -g mcp-remote@latest

# Set default environment variable for INSIGHTS_REMOTE_MCP_URL
ENV INSIGHTS_REMOTE_MCP_URL=https://mcp.insights.hanzo.ai/mcp

USER node

# The entrypoint will run mcp-remote with proper stdio handling
# INSIGHTS_AUTH_HEADER should be just the token, we'll add "Bearer " prefix
ENTRYPOINT ["sh", "-c", "mcp-remote \"${INSIGHTS_REMOTE_MCP_URL}\" --header \"Authorization:Bearer ${INSIGHTS_AUTH_HEADER}\""]
