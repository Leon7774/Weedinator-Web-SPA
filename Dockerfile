# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install CPU-only PyTorch first to avoid downloading CUDA libs (saves ~6GB)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Define environment variable
ENV FLASK_APP=app.py

# Run the application using Gunicorn (production server)
# Use shell form to allow variable expansion for $PORT
CMD gunicorn --bind 0.0.0.0:$PORT app:app
