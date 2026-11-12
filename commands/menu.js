export default {
  name: "menu",
  description: "List available commands",
  async execute({ commands, prefix }) {
    return ["🤖 SANEZO X ULTRA — COMMANDS", ...commands.map(c => `${prefix}${c.name} — ${c.description}`)].join("\n");
  }
};
