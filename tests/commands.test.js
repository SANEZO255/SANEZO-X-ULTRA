import test from "node:test";
import assert from "node:assert/strict";
import { listCommands, runCommand } from "../lib/commands.js";

test("commands are registered", () => {
  assert.deepEqual(listCommands().map(c => c.name), ["menu", "ping", "alive"]);
});
test("ping returns pong", async () => {
  assert.match(await runCommand(".ping"), /Pong/);
});
test("alive returns status", async () => {
  assert.match(await runCommand(".alive"), /alive/i);
});
test("menu lists available commands", async () => {
  const output = await runCommand(".menu");
  assert.match(output, /\.ping/);
  assert.match(output, /\.alive/);
});
test("non-commands and unknown commands are ignored", async () => {
  assert.equal(await runCommand("hello"), null);
  assert.equal(await runCommand(".missing"), null);
});
