# container-ssh
This is a barebones demo of a Cloudflare Container with ssh access via a Cloudflare tunnel.

### How it works
- A public key is included in the container image, built locally
- The tunnel token is stored as secret and injected via $CF_TUNNEL
- When running on Cloudflare, the container is accessible at 10.0.0.1
- Both the tunnel and the WARP profile are configured with a CIDR in this range
- ~/.ssh/config points to the same address, and uses the private key for authentication

### Issues
The implementation works as a proof of concept, however when deployed on Cloudflare, establishing QUIC outbound tunnels does not work reliably. See https://github.com/jldec/container-ssh/issues/1

### Hosted setup (with WARP)
- Clone this repo, rename the worker in wrangler.jsonc if necessary
- Copy your public key into the repo as pk.pub
- Create a cloudflared tunnel in the Cloudflare dashboard and grab the tunnel token (the part after `cloudflared tunnel run --token`)
- Run `wrangler secret put CF_TUNNEL` and paste the tunnel token
- Configure both the tunnel and the WARP profile with CIDR 10.0.0.0/8. NOTE: the WARP profile now lives in the Zero Trust dashboard under Team & Resources > Devices > Device Profiles > Default Profile ... Configure.
- Run `wranger deploy` to build the container and deploy it to Cloudflare
- Add an entry to ~/.ssh/config for the container
  ```
  Host container-ssh
      HostName 10.0.0.1
      User user
      IdentityFile ~/.ssh/{your-private-key}.pem
      SetEnv TERM=xterm-256color
  ```
- Connect to the container using `ssh container-ssh`
- Browse to https://container-ssh.{your-subdomain}.workers.dev/
  ```
  /hello  fetches from bun running in the container.
  /status checks if the container is started.
  /stop   shuts down the container.
  ```
- Turn on Cloudflare Access to protect the public endpoit from abuse. The container should run for at least 20 minutes.

<img width="2286" height="828" alt="Screenshot 2025-11-24 at 08 53 33" src="https://github.com/user-attachments/assets/f6b6314c-8aff-4462-8f67-01803a38c89c" />

### Local dev setup (without WARP)
- _NOTE: the WARP setup above should also work for localhost using IP 172.17.0.2 instead of 10.0.0.1_
- Create a different tunnel in the Cloudflare dashboard and grab the new tunnel token
- Configure the tunnel with a published application route (DNS hostname) pointing to `tcp://localhost:22`
- Add `CF_TUNNEL={tunnel-token}` in .env
- Run `wrangler dev` to build the container and run the local worker
- Start a TCP proxy with `cloudflared access tcp --hostname {your-fqdn} --url tcp://localhost:2222`
- Add an entry to ~/.ssh/config for the container
  ```
  Host container-ssh-local
      HostName localhost
      Port 2222
      User user
      IdentityFile ~/.ssh/{your-private-key}.pem
      SetEnv TERM=xterm-256color
  ```
- Connect to the container using `ssh container-ssh-local`
- Browse to https://localhost:8787/ for the same HTTP routes as above.

<img width="2280" height="824" alt="Screenshot 2025-11-24 at 08 54 59" src="https://github.com/user-attachments/assets/3b4915aa-caf4-4539-bbbc-2307357e59f2" />
