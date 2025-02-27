// mcos is a game server, written from scratch, for an old game
// Copyright (C) <2017-2021>  <Drazi Crendraven>
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import test from "ava";
import { EMessageDirection } from "../types/index";
import { MessageNode } from "./index";

const messageNode1 = new MessageNode(EMessageDirection.RECEIVED);
messageNode1.deserialize(
  Buffer.from([
    0x16, 0x00, 0x54, 0x4f, 0x4d, 0x43, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ])
);

test("MessageNode", (t) => {
  t.throws(() => {
    new MessageNode(EMessageDirection.RECEIVED).deserialize(
      Buffer.from([0x00, 0x00])
    );
  },undefined, "[MessageNode] Not long enough to deserialize, only 2 bytes long");

  t.true(messageNode1.isMCOTS());
  t.is(messageNode1.seq, 6)
  t.regex(messageNode1.dumpPacket(), /1600544f4d43/); 
});
