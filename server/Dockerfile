FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy all server files
COPY . .

# Create persistent storage folder for files
RUN mkdir -p storage/pos

# EXPOSE 8000 (though Railway will handle the mapping)
EXPOSE 8000

# Start application using Gunicorn for production
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
