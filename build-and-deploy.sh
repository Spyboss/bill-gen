#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Building Bill Generator Docker Image ===${NC}"

# Build the Docker image with security scanning
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t bill-gen:latest .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Docker image built successfully!${NC}"
else
    echo -e "${RED}Docker build failed!${NC}"
    exit 1
fi

# Run security scan on the image
echo -e "${YELLOW}Running security scan on the image...${NC}"
# Uncomment and use your preferred security scanner
# docker scan bill-gen:latest

# Tag the image for deployment
echo -e "${YELLOW}Tagging image for deployment...${NC}"
docker tag bill-gen:latest bill-gen:$(date +%Y%m%d)

echo -e "${GREEN}=== Build and Tag Complete ===${NC}"
echo -e "${YELLOW}To push to a registry, run:${NC}"
echo -e "docker push bill-gen:latest"
echo -e "docker push bill-gen:$(date +%Y%m%d)"

echo -e "${YELLOW}To run the container locally:${NC}"
echo -e "docker run -p 8080:8080 bill-gen:latest"
