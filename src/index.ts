import { env } from 'cloudflare:workers'
import { DurableObject } from "cloudflare:workers"

const containerID = 'container-id'

function onContainerExit() {
  console.log("Container exited");
}

// the "err" value can be customized by the destroy() method
async function onContainerError(err:any) {
  console.log("Container errored", err);
}

// https://developers.cloudflare.com/durable-objects/api/container/
export class ContainerClass extends DurableObject {
  async start() {
    this.ctx.container?.start({
      env: {
        CF_TUNNEL: env.CF_TUNNEL
      },
      enableInternet: true
    })
    this.ctx.container?.monitor().then(onContainerExit).catch(onContainerError)
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
      await container.start()
      return new Response('container-ssh started')
    }
    if (url.pathname === '/destroy') {
      const container = env.CONTAINER_DO.getByName(containerID)
      await container.destroy()
      return new Response('container-ssh destroyed')
    }
    return new Response('not found', { status: 404 })
  }
}
