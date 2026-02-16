# 1. Base Image
FROM python:3.10-slim

# 2. Install System Dependencies
# FIX: Added 'libglib2.0-0' which solves the 'libgthread' error
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Set Working Directory
WORKDIR /app

# 4. Install Python Libraries
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy Your Code
COPY main.py .

# 6. Expose the Port
EXPOSE 8000

# 7. Command to Start the Server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]