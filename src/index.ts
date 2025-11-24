import { Container } from '@cloudflare/containers'

const containerID = 'container-id'

// https://developers.cloudflare.com/containers/container-package/
export class ContainerClass extends Container<Env> {
  defaultPort = 3000
  sleepAfter = '20m'

  envVars = {
    CF_TUNNEL: this.env.CF_TUNNEL
  }

  override async onStart() {
    console.log('Container started')
  }

  override async onStop() {
    console.log('Container stopped')
  }
}

export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url)

    if (url.pathname === '/') {
      return new Response('container-ssh: use /hello to access the bun server')
    }

    if (url.pathname === '/hello') {
      const container = env.CONTAINER_DO.getByName(containerID)
      return container.fetch(req)
    }

    return new Response('not found', { status: 404 })
  }
}
