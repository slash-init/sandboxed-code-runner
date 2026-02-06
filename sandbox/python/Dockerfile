# downloads a Linux image with Python already installed.
# “slim” = small size, fewer unnecessary tools.
FROM python:3.11-slim

# Inside the container:
# cd /app
# Everything happens here.
WORKDIR /app

# Create a non-root user
# This command creates a new user named sandbox-user inside the container.
# The -m flag ensures that a home directory is created for the user (e.g., /home/sandbox-user).
RUN useradd -m sandbox-user
# Switch the default user for the container from root to sandbox-user
USER sandbox-user 

# When container starts, it automatically runs:
# python3 main.py
CMD ["bash", "-c", "python3 main.py < input.txt"]

# docker build -t python-sandbox .
# What happenes
# Docker:
#     Reads Dockerfile
#     Downloads base image
#     Applies instructions
#     Saves result as python-sandbox