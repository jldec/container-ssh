import { env } from 'cloudflare:workers'
import { DurableObject } from "cloudflare:workers"

const containerID = 'container-id'

// https://developers.cloudflare.com/durable-objects/api/container/
export class ContainerClass extends DurableObject {

  async start() {
    if (this.ctx.container?.running) return 'already running'
    this.ctx.container?.start({
      env: {
        CF_TUNNEL: env.CF_TUNNEL
      },
      enableInternet: true
    })
    this.ctx.container?.monitor().then(() => {
      console.log("Container started")
    }).catch((err) => {
      console.error("Container monitor error", err)
    })
    return 'starting'
  }

  async destroy() {
    await this.ctx.container?.destroy()
  }
}

export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url)
    if (url.pathname == '/') {
      return new Response('use /start or /destroy')
    }
    if (url.pathname === '/start') {
      const container = env.CONTAINER_DO.getByName(containerID)
      const status = await container.start()
      return new Response(`container-ssh ${status}`)
    }
    if (url.pathname === '/destroy') {
      const container = env.CONTAINER_DO.getByName(containerID)
      await container.destroy()
      return new Response('container-ssh destroyed')
    }
    return new Response('not found', { status: 404 })
  }
}
