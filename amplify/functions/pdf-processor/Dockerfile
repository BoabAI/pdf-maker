# Lambda container image for PDF generation with Chrome/Puppeteer
FROM public.ecr.aws/lambda/nodejs:20

# Install Chrome dependencies for Amazon Linux 2023
RUN dnf install -y \
    atk \
    cups-libs \
    gtk3 \
    libXcomposite \
    alsa-lib \
    libXcursor \
    libXdamage \
    libXext \
    libXi \
    libXrandr \
    libXScrnSaver \
    libXtst \
    pango \
    at-spi2-atk \
    libXt \
    xorg-x11-server-Xvfb \
    nss \
    mesa-libgbm \
    libdrm \
    libxkbcommon \
    && dnf clean all

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy function code
COPY . .

# Set handler
CMD [ "handler.handler" ]
