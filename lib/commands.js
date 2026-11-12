import ping from "../commands/ping.js";
import alive from "../commands/alive.js";
import menu from "../commands/menu.js";

const commands = [menu, ping, alive];
const registry = new Map(commands.map(command => [command.name, command]));

export function listCommands() {
  return commands.map(({ name, description }) => ({ name, description }));
}

export async function runCommand(message, { prefix = "." } = {}) {
  if (typeof message !== "string" || !message.startsWith(prefix)) return null;
  const [name] = message.slice(prefix.length).trim().toLowerCase().split(/\s+/);
  const command = registry.get(name);
  if (!command) return null;
  return command.execute({ prefix, commands: listCommands() });
}
