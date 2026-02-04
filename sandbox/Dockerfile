# downloads a Linux image with Python already installed.
# “slim” = small size, fewer unnecessary tools.
FROM python:3.11-slim

# Inside the container:
# cd /app
# Everything happens here.
WORKDIR /app

# When container starts, it automatically runs:
# python3 main.py
CMD ["python3", "main.py"]


# docker build -t python-sandbox .
# What happenes
# Docker:
#     Reads Dockerfile
#     Downloads base image
#     Applies instructions
#     Saves result as python-sandbox