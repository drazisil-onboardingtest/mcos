import { IncomingMessage, ServerResponse } from "http";
import { logger } from "../logger";
import { PatchServer } from "../patch";
import { ShardServer } from "../shard";

const log = logger.child({ service: "http" });

export function httpListener(req: IncomingMessage, res: ServerResponse): void {
  if (
    req.url === "/games/EA_Seattle/MotorCity/UpdateInfo" ||
    req.url === "/games/EA_Seattle/MotorCity/NPS" ||
    req.url === "/games/EA_Seattle/MotorCity/MCO"
  ) {
    log.debug("http routing request to patch server");
    return PatchServer.getInstance().handleRequest(req, res);
  }
  if (
    req.url === "/cert" ||
    req.url === "/key" ||
    req.url === "/registry" ||
    req.url === "/ShardList/"
  ) {
    log.debug("http routing request to shard server");
    return ShardServer.getInstance()._handleRequest(req, res);
  }

  log.warn(
    `Unexpected request for ${req.url} from ${req.socket.remoteAddress}, skipping.`
  );
  res.statusCode = 404;
  res.end("Not found");
}
