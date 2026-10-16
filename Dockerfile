FROM node:22-bookworm@sha256:0e5f906573693feaa1e21057ebdcfdb5bd5021f050b2dc7c9deceb629c7da2a8
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-sympy \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
COPY package*.json ./
RUN npm ci && npx playwright install --with-deps chromium firefox webkit \
    && chmod -R a+rX /opt/playwright
ENV HOME=/tmp/lab-home
CMD ["npm", "run", "dev", "--", "--port", "5173"]
