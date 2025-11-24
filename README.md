# container-ssh
This is a barebones demo of a Cloudflare Container with ssh access via a Cloudflare tunnel.

### How it works
- A public key is included in the container image, built locally
- The tunnel token is stored as secret and injected via $CF_TUNNEL
- When running on Cloudflare, the container is accessible at 10.0.0.1
- Both the tunnel and the WARP profile are configured with a CIDR in this range
- ~/.ssh/config points to the same address, and uses the privte key for authentication

### Issues
The implementation works as a proof of concept, however several issues remain.

1. When deployed on Cloudflare, establishing QUIC outbound tunnels does not work reliably.
1. The container shuts down a minute after starting (not using @cloudflare/containers to keep alive)
1. Running the WARP client is convenient to connect to the private address on Cloudflare, but it prevents outbound QUIC tunnels from working when testing the container locally.

### Hosted setup (with WARP)
1. Clone this repo, rename the worker in wrangler.jsonc if necessary
1. Copy your public key into the repo as pk.pub
1. Create a cloudflared tunnel in the Cloudflare dashboard and grab the tunnel token (the part after `cloudflared tunnel run --token`)
1. Run `wrangler secret put CF_TUNNEL` and paste the tunnel token
1. Configure both the tunnel and the WARP profile with CIDR 10.0.0.0/8.
   The WARP profile now lives in the Zero Trust dashboard under Team & Resources > Devices > Device Profiles > Default Profile ... Configure.
1. Run `wranger deploy` to build the container and deploy it to Cloudflare
1. Add an entry to ~/.ssh/config for the container
  ```
  Host container-ssh
      HostName 10.0.0.1
      User user
      IdentityFile ~/.ssh/{your-private-key}.pem
      SetEnv TERM=xterm-256color
  ```
1. Start the container at https://container-ssh.{your-subdomain}.workers.dev/start
1. Connect to the container using `ssh container-ssh`
1. Shut down the container at  https://container-ssh.{your-subdomain}.workers.dev/destroy

### Local dev setup (without WARP)
1. Create a different tunnel in the Cloudflare dashboard and grab the new tunnel token
1. Configure the tunnel with a published application route (DNS hostname) pointing to `tcp://localhost:22`
1. Add `CF_TUNNEL={tunnel-token}` in .env
1. Run `wrangler dev` to build the container and run the local worker
1. Start a TCP proxy with `cloudflared access tcp --hostname {your-fqdn} --url tcp://localhost:2222`
1. Add an entry to ~/.ssh/config for the container
  ```
  Host container-ssh-local
      HostName localhost
      Port 2222
      User user
      IdentityFile ~/.ssh/{your-private-key}.pem
      SetEnv TERM=xterm-256color
  ```
1. Start the container at https://localhost:8787/start
1. Connect to the container using `ssh container-ssh-local`
1. Shut down the container at  https://localhost:8787/destroy


