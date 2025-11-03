# FABEO Microservice
# Python 2.7 environment for FABEO/Charm-crypto compatibility

# Use Ubuntu 16.04 as required by FABEO
FROM ubuntu:16.04

# Set environment variables
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
ENV LIBRARY_PATH /usr/local/lib
ENV LD_LIBRARY_PATH /usr/local/lib
ENV PYTHONPATH "/app/FABEO"

WORKDIR /app

# Install system dependencies exactly as FABEO requires
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    locales \
    wget \
    git \
    python \
    python-pip \
    gcc \
    flex \
    bison \
    build-essential \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install GMP 5.x
RUN wget https://ftp.gnu.org/gnu/gmp/gmp-5.1.3.tar.gz && \
    tar -xf gmp-5.1.3.tar.gz && \
    cd gmp-5.1.3 && \
    ./configure && make && make install && \
    cd .. && rm -rf gmp-5.1.3*

# Install PBC 0.5.14
RUN wget https://crypto.stanford.edu/pbc/files/pbc-0.5.14.tar.gz && \
    tar -xf pbc-0.5.14.tar.gz && \
    cd pbc-0.5.14 && \
    ./configure && make && make install && \
    cd .. && rm -rf pbc-0.5.14*

# Install Python 2.7 dependencies for Charm
RUN pip install setuptools==0.6c11 pyparsing==1.5.6

# Install Charm-crypto 0.43 from source - use the Python 2.7 compatible branch
RUN wget https://github.com/JHUISI/charm/releases/download/v0.43/Charm-Crypto-0.43_Python2.7.tar.gz && \
    tar -xf Charm-Crypto-0.43_Python2.7.tar.gz && \
    cd Charm-Crypto-0.43 && \
    sed -i "s|http://|https://|g" distribute_setup.py && \
    ./configure.sh && \
    make && \
    make install && \
    ldconfig

# Copy FABEO source
COPY submodules/FABEO ./FABEO
RUN cd FABEO && make && pip install .

# Copy service source
COPY services/fabeo-service/ ./service/
WORKDIR /app/service

# Install Flask for simple HTTP server (compatible with Python 2.7)
RUN pip install "MarkupSafe<2.0" && \
    pip install Flask==1.1.4 Werkzeug==1.0.1 && \
    pip install pycrypto

# Create non-root user
RUN adduser --disabled-password --gecos '' fabeouser && \
    chown -R fabeouser:fabeouser /app
USER fabeouser

EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import sys; sys.path.insert(0, '/app/FABEO'); from FABEO.fabeo22cp import FABEO22CPABE; print('OK')" || exit 1

CMD ["python", "main.py"]