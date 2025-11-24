FROM ubuntu:24.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# unminimize will ask "yes/no" — we automate the "yes"
RUN yes | unminimize

# Install dependencies
RUN apt-get update && apt-get install -y \
    sudo \
    openssh-server \
    curl \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Add cloudflare gpg key
RUN mkdir -p --mode=0755 /usr/share/keyrings && \
    curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg -o /usr/share/keyrings/cloudflare-public-v2.gpg

# Add cloudflare repo to apt repositories
RUN echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared any main' > /etc/apt/sources.list.d/cloudflared.list

# Install cloudflared
RUN apt-get update && apt-get install -y cloudflared && \
    rm -rf /var/lib/apt/lists/*

# Example: create a normal user with sudo and login capability
RUN groupadd -r user && \
    useradd -r -g user -m -s /bin/bash user && \
    echo "user ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/user

# Configure SSH directory for user
RUN mkdir -p /home/user/.ssh && \
    chmod 700 /home/user/.ssh

# Copy public key and configure authorized_keys
COPY pk.pub /home/user/.ssh/authorized_keys
RUN chmod 600 /home/user/.ssh/authorized_keys && \
    chown -R user:user /home/user/.ssh

# Configure sshd
RUN mkdir -p /var/run/sshd && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    echo "AllowUsers user" >> /etc/ssh/sshd_config

# Generate SSH host keys
RUN ssh-keygen -A

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Start sshd\n\
mkdir -p /var/run/sshd\n\
/usr/sbin/sshd\n\
\n\
# Run cloudflared tunnel\n\
if [ -z "$CF_TUNNEL" ]; then\n\
    echo "Error: CF_TUNNEL environment variable is not set"\n\
    exit 1\n\
fi\n\
\n\
exec cloudflared tunnel run --token $CF_TUNNEL\n\
' > /entrypoint.sh && chmod +x /entrypoint.sh

# Expose SSH port
EXPOSE 22

# Set environment variable for tunnel token (will be provided at runtime)
ENV CF_TUNNEL=""

# Set terminal type
ENV TERM=xterm-256color

ENTRYPOINT ["/entrypoint.sh"]
