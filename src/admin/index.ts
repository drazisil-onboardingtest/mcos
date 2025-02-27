// mcos is a game server, written from scratch, for an old game
// Copyright (C) <2017-2021>  <Drazi Crendraven>
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import type { IncomingMessage, ServerResponse } from "http";
// import { createServer } from "https";
// import type { Server, Socket } from "net";
import { logger } from "../logger/index";
import { ConnectionManager } from "../core/connection-mgr";
// import config from "../config/appconfig";
// import { SslOptions } from "../types";
// import { readFileSync } from "fs";

const log = logger.child({ service: "mcoserver:AdminServer;" });

/**
 * SSL web server for managing the state of the system
 */

// function _sslOptions(): SslOptions {
//   log.debug(`Reading ssl certificate...`);

//   let cert;
//   let key;

//   try {
//     if (!config.MCOS.CERTIFICATE.CERTIFICATE_FILE) {
//       throw new Error("Please set MCOS__CERTIFICATE__CERTIFICATE_FILE");
//     }
//     cert = readFileSync(config.MCOS.CERTIFICATE.CERTIFICATE_FILE, {
//       encoding: "utf-8",
//     });
//   } catch (error) {
//     throw new Error(
//       `Error loading ${config.MCOS.CERTIFICATE.CERTIFICATE_FILE}: (${error}), server must quit!`
//     );
//   }

//   try {
//     if (!config.MCOS.CERTIFICATE.PRIVATE_KEY_FILE) {
//       throw new Error("Please set MCOS__CERTIFICATE__PRIVATE_KEY_FILE");
//     }
//     key = readFileSync(config.MCOS.CERTIFICATE.PRIVATE_KEY_FILE, {
//       encoding: "utf-8",
//     });
//   } catch (error) {
//     throw new Error(
//       `Error loading ${config.MCOS.CERTIFICATE.PRIVATE_KEY_FILE}: (${error}), server must quit!`
//     );
//   }

//   return {
//     cert,
//     honorCipherOrder: true,
//     key,
//     rejectUnauthorized: false,
//   };
// }

/**
 * @property {config} config
 * @property {IMCServer} mcServer
 * @property {Server} httpServer
 */
export class AdminServer {
  private static _instance: AdminServer;
  // httpsServer: Server | undefined;

  static getInstance(): AdminServer {
    if (!AdminServer._instance) {
      AdminServer._instance = new AdminServer();
    }
    return AdminServer._instance;
  }

  private constructor() {
    // Intentionally empty
  }

  /**
   * @return {string}
   */
  _handleGetConnections(): string {
    const connections = ConnectionManager.getInstance().dumpConnections();
    let responseText = "";
    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];
      if (typeof connection === "undefined") {
        return "No connections were found";
      }
      const displayConnection = `
      index: ${i} - ${connection.id}
          remoteAddress: ${connection.remoteAddress}:${connection.localPort}
          Encryption ID: ${connection.getEncryptionId()}
          inQueue:       ${connection.inQueue}
      `;
      responseText += displayConnection;
    }

    return responseText;
  }

  /**
   * @return {string}
   */
  _handleResetAllQueueState(): string {
    ConnectionManager.getInstance().resetAllQueueState();
    const connections = ConnectionManager.getInstance().dumpConnections();
    let responseText = "Queue state reset for all connections\n\n";
    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];
      if (typeof connection === "undefined") {
        return responseText.concat("No connections found");
      }
      const displayConnection = `
      index: ${i} - ${connection.id}
          remoteAddress: ${connection.remoteAddress}:${connection.localPort}
          Encryption ID: ${connection.getEncryptionId()}
          inQueue:       ${connection.inQueue}
      `;
      responseText += displayConnection;
    }

    return responseText;
  }

  /**
   * @return {void}
   * @param {import("http").IncomingMessage} request
   * @param {import("http").ServerResponse} response
   */
  public handleRequest(
    request: IncomingMessage,
    response: ServerResponse
  ): void {
    log.info(
      `[Admin] Request from ${request.socket.remoteAddress} for ${request.method} ${request.url}`
    );
    log.info(
      `Request received,
      ${JSON.stringify({
        url: request.url,
        remoteAddress: request.socket.remoteAddress,
      })}`
    );
    switch (request.url) {
      case "/admin/connections":
        response.setHeader("Content-Type", "text/plain");
        return response.end(this._handleGetConnections());

      case "/admin/connections/resetAllQueueState":
        response.setHeader("Content-Type", "text/plain");
        return response.end(this._handleResetAllQueueState());

      default:
        if (request.url && request.url.startsWith("/admin")) {
          return response.end("Jiggawatt!");
        }
    }
  }

  /**
   * @returns {void}
   * @param {import("net").Socket} socket
  //  */
  // private _socketEventHandler(socket: Socket): void {
  //   socket.on("error", (error) => {
  //     throw new Error(`[AdminServer] SSL Socket Error: ${error.message}`);
  //   });
  // }

  /**
   * @param {module:config.config} config
   * @return {Promise<void>}
   */
  // start(): Server {
  //   try {
  //     const sslOptions = _sslOptions();

  //     /** @type {import("https").Server} */
  //     this.httpsServer = createServer(
  //       sslOptions,
  //       (
  //         /** @type {import("http").IncomingMessage} */ request: import("http").IncomingMessage,
  //         /** @type {import("http").ServerResponse} */ response: import("http").ServerResponse
  //       ) => {
  //         this.handleRequest(request, response);
  //       }
  //     );
  //   } catch (err) {
  //     const error = err as Error;
  //     throw new Error(`${error.message}, ${error.stack}`);
  //   }

  //   this.httpsServer.on("connection", this._socketEventHandler.bind(this));

  //   const port = 88;

  //   log.debug(`Attempting to bind to port ${port}`);

  //   return this.httpsServer.listen({ port, host: "0.0.0.0" }, () => {
  //     log.debug("port 88 listening");
  //   });
  // }
}
