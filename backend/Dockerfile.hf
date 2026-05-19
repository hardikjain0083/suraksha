# Dockerfile tailored for Hugging Face Spaces deployment
FROM python:3.11-slim

# Install system dependencies (required for pymupdf etc if needed)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face requires running as a non-root user (user ID 1000)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Install dependencies
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=user . .

# Hugging Face Spaces map external port to 7860 internally
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
