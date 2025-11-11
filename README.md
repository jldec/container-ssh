# container-demo-terminal
Minimal demo of a Cloudflare Container using [tty2web](https://github.com/kost/tty2web) to serve a terminal in a browser.

Deployed at https://container-demo-terminal.jldec.workers.dev

![container-demo-terminal](https://github.com/user-attachments/assets/512aad79-04ba-43d2-8fd0-7fe04fa388fe)


### To run locally using wrangler
Ensure that Docker Desktop is running. Wrangler will build a new image targeting linux/amd64. Open in your browser at https://localhost:8787
```sh
pnpm dev
```

### To deploy to Cloudflare
This is not required after you link your Worker to a git repository for automated builds and deploys.
```sh
pnpm ship
```

### To run the container
This builds a linux/amd64 docker image called `container-demo-terminal`.  
Docker Desktop on macOS with apple silicon can run x86 containers using rosetta emulation.
```sh
pnpm image:build
pnpm image:run
```

