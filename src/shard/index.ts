// @ts-check
// mcos is a game server, written from scratch, for an old game
// Copyright (C) <2017-2021>  <Drazi Crendraven>
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import config from "../config/appconfig";
import { logger } from "../logger/index";
import { readFileSync } from "fs";
// import { EServerConnectionName, RoutingMesh } from "../router";
import { ShardEntry } from "./shard-entry";
import { createServer, Server } from "https";
import { IncomingMessage, ServerResponse } from "http";

// This section of the server can not be encrypted. This is an intentional choice for compatibility
// deepcode ignore HttpToHttps: This is intentional. See above note.
const log = logger.child({ service: "MCOServer:Shard" });

/**
 * Manages patch and update server connections
 * Also handles the shard list, and some utility endpoints
 * TODO: Document the endpoints
 */

/**
 * @class
 * @property {config.config} config
 * @property {string[]} banList
 * @property {string[]} possibleShards
 * @property {Server} serverPatch
 */
export class ShardServer {
  static _instance: ShardServer;
  private _possibleShards: string[] = [];
  _server: Server;

  static getInstance(): ShardServer {
    if (!ShardServer._instance) {
      ShardServer._instance = new ShardServer();
    }
    return ShardServer._instance;
  }

  private constructor() {
    this._server = createServer((request, response) => {
      this._handleRequest(request, response);
    });

    this._server.on("error", (error) => {
      process.exitCode = -1;
      log.error(`Server error: ${error.message}`);
      log.info(`Server shutdown: ${process.exitCode}`);
      process.exit();
    });
  }

  /**
   * Generate a shard list web document
   *
   * @return {string}
   * @memberof! PatchServer
   */
  _generateShardList(): string {
    if (!config.MCOS.SETTINGS.SHARD_EXTERNAL_HOST) {
      throw new Error(`Please set MCOS__SETTINGS__SHARD_EXTERNAL_HOST`);
    }
    const shardHost = config.MCOS.SETTINGS.SHARD_EXTERNAL_HOST;
    const shardClockTower = new ShardEntry(
      "The Clocktower",
      "The Clocktower",
      44,
      shardHost,
      8226,
      shardHost,
      7003,
      shardHost,
      0,
      "",
      "Group-1",
      88,
      2,
      shardHost,
      80
    );

    this._possibleShards.push(shardClockTower.formatForShardList());

    const shardTwinPinesMall = new ShardEntry(
      "Twin Pines Mall",
      "Twin Pines Mall",
      88,
      shardHost,
      8226,
      shardHost,
      7003,
      shardHost,
      0,
      "",
      "Group-1",
      88,
      2,
      shardHost,
      80
    );

    this._possibleShards.push(shardTwinPinesMall.formatForShardList());

    /** @type {string[]} */
    const activeShardList: string[] = [];
    activeShardList.push(shardClockTower.formatForShardList());

    return activeShardList.join("\n");
  }

  /**
   *
   * @return {string}
   * @memberof! WebServer
   */
  _handleGetCert(): string {
    if (!config.MCOS.CERTIFICATE.CERTIFICATE_FILE) {
      throw new Error("Pleas set MCOS__CERTIFICATE__CERTIFICATE_FILE");
    }
    return readFileSync(config.MCOS.CERTIFICATE.CERTIFICATE_FILE).toString();
  }

  /**
   *
   * @return {string}
   * @memberof! WebServer
   */
  _handleGetKey(): string {
    if (!config.MCOS.CERTIFICATE.PUBLIC_KEY_FILE) {
      throw new Error("Please set MCOS__CERTIFICATE__PUBLIC_KEY_FILE");
    }
    return readFileSync(config.MCOS.CERTIFICATE.PUBLIC_KEY_FILE).toString();
  }

  /**
   *
   * @return {string}
   * @memberof! WebServer
   */
  _handleGetRegistry(): string {
    if (!config.MCOS.SETTINGS.AUTH_EXTERNAL_HOST) {
      throw new Error("Please set MCOS__SETTINGS__AUTH_EXTERNAL_HOST");
    }
    if (!config.MCOS.SETTINGS.SHARD_EXTERNAL_HOST) {
      throw new Error("Please set MCOS__SETTINGS__SHARD_EXTERNAL_HOST");
    }
    if (!config.MCOS.SETTINGS.PATCH_EXTERNAL_HOST) {
      throw new Error("Please set MCOS__SETTINGS__PATCH_EXTERNAL_HOST");
    }
    const patchHost = config.MCOS.SETTINGS.PATCH_EXTERNAL_HOST;
    const authHost = config.MCOS.SETTINGS.AUTH_EXTERNAL_HOST;
    const shardHost = config.MCOS.SETTINGS.SHARD_EXTERNAL_HOST;
    return `Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\EACom\\AuthAuth]
"AuthLoginBaseService"="AuthLogin"
"AuthLoginServer"="${authHost}"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Electronic Arts\\Motor City]
"GamePatch"="games/EA_Seattle/MotorCity/MCO"
"UpdateInfoPatch"="games/EA_Seattle/MotorCity/UpdateInfo"
"NPSPatch"="games/EA_Seattle/MotorCity/NPS"
"PatchServerIP"="${patchHost}"
"PatchServerPort"="80"
"CreateAccount"="${authHost}/SubscribeEntry.jsp?prodID=REG-MCO"
"Language"="English"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Electronic Arts\\Motor City\\1.0]
"ShardUrl"="http://${shardHost}/ShardList/"
"ShardUrlDev"="http://${shardHost}/ShardList/"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Electronic Arts\\Motor City\\AuthAuth]
"AuthLoginBaseService"="AuthLogin"
"AuthLoginServer"="${authHost}"

[HKEY_LOCAL_MACHINE\\Software\\WOW6432Node\\Electronic Arts\\Network Play System]
"Log"="1"

`;
  }

  /**
   * @return {void}
   * @memberof ! PatchServer
   * @param {import("http").IncomingMessage} request
   * @param {import("http").ServerResponse} response
   */
  _handleRequest(request: IncomingMessage, response: ServerResponse): void {
    if (request.url === "/cert") {
      response.setHeader(
        "Content-disposition",
        "attachment; filename=cert.pem"
      );
      return response.end(this._handleGetCert());
    }

    if (request.url === "/key") {
      response.setHeader("Content-disposition", "attachment; filename=pub.key");
      return response.end(this._handleGetKey());
    }

    if (request.url === "/registry") {
      response.setHeader("Content-disposition", "attachment; filename=mco.reg");
      return response.end(this._handleGetRegistry());
    }

    if (request.url === "/") {
      response.statusCode = 404;
      return response.end("Hello, world!");
    }

    if (request.url === "/ShardList/") {
      log.debug(
        `Request from ${request.socket.remoteAddress} for ${request.method} ${request.url}.`
      );

      response.setHeader("Content-Type", "text/plain");
      return response.end(this._generateShardList());
    }

    // Is this a hacker?
    response.statusCode = 404;
    response.end("");

    // Unknown request, log it
    log.info(
      `Unknown Request from ${request.socket.remoteAddress} for ${request.method} ${request.url}`
    );
  }

  start(): Server {
    if (!config.MCOS.SETTINGS.SHARD_LISTEN_HOST) {
      throw new Error("Please set MCOS__SETTINGS__SHARD_LISTEN_HOST");
    }
    const host = config.MCOS.SETTINGS.SHARD_LISTEN_HOST;
    const port = 80;
    log.debug(`Attempting to bind to port ${port}`);
    return this._server.listen({ port, host }, () => {
      log.debug(`port ${port} listening`);
      log.info("Shard server is listening...");

      // // Register service with router
      // RoutingMesh.getInstance().registerServiceWithRouter(
      //   EServerConnectionName.SHARD,
      //   host,
      //   port
      // );
    });
  }
}
