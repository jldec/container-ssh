import { env } from 'cloudflare:workers'
import { Container } from '@cloudflare/containers'

// singleton durable object
const containerID = 'container-id'
const getContainerDO = () => env.CONTAINER_DO.getByName(containerID)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// container DO class
// https://developers.cloudflare.com/containers/container-package/
// https://github.com/cloudflare/containers
export class ContainerClass extends Container {
  defaultPort = 3000
  sleepAfter = '20m'

  envVars = {
    CF_TUNNEL: env.CF_TUNNEL,
    CONTAINER_IP: '10.0.0.2'
  }

  override async onStart() {
    console.log('Container started')
  }

  override async onStop() {
    console.log('Container stopped')
  }
}

// worker entry point
export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url)

    if (url.pathname === '/') {
      return new Response(`container-ssh: (10.0.0.2)
==============
/hello   starts container and forwards request to bun
/status  checks container state
/stop    gracefully shuts down the container
/destroy forecibly shuts down the container
`)
    }

    if (url.pathname === '/hello') {
      const container = getContainerDO()
      return container.fetch(req)
    }

    if (url.pathname === '/status') {
      const container = getContainerDO()
      return Response.json(await container.getState())
    }

    if (url.pathname === '/stop') {
      const container = getContainerDO()
      await container.stop()
      await sleep(1000)
      return Response.json(await container.getState())
    }

    if (url.pathname === '/destroy') {
      const container = getContainerDO()
      await container.destroy()
      await sleep(1000)
      return Response.json(await container.getState())
    }

    return new Response('not found', { status: 404 })
  }
}
