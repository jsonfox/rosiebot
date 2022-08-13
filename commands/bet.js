const { isAdmin } = require('../utils/helpers');
const logger = require('../utils/logger');
const { EmbedBuilder } = require('discord.js');

exports.run = async (client, message, args) => {
  const bet = client.container.bets.get(message.guild.id);

  try {
    switch (flags[0]) {
      case 'c': // Create cases for all flag aliases
      case 'create':
      case 'start':
      case 'new':
        // Check for active bet
        if (bet && bet.active) throw new Error('There')
        // Destructure bet creation operands
        const name = args.shift();
        const [one, two] = args.join(' ').split(',');
        // Check for valid bet creation criteria
        if (!(name && one && two)) throw new Error(`Invalid command usage, use \`${prefix}help bet\` for more information`);
    }
  } catch (err) {
    message.reply(`❌ Could not run command: ${err.message}`);
  }
};

exports.config = {
  name: 'bet',
  alias: ['b'],
  description: '',
  usage: '',
  enabled: true,
  guildOnly: true,
  permLevel: 'User',
};

class Bet {
  constructor(name, optionOne, optionTwo, ownerId, displayMsg) {
    this.#name = name;
    this.#optionOne = {
      name: optionOne,
      betters: []
    };
    this.#optionTwo = {
      name: optionTwo,
      betters: []
    };
    this.#open = true;
    this.#active = true;
    this.#winner = null;
    this.#betOwner = ownerId;
    this.#display = displayMsg;
    this.#updateEmbed();
  }

  #getEmbed() {
    return;
  }

  #getResultEmbed() {
    return;
  }

  #updateEmbed() {
    this.#display.edit({ embeds: [this.#getEmbed()] });
  }

  isBetAdmin(member) {
    return (this.#betOwner === member.id || isAdmin(member));
  }

  isActive() {
    return this.#active;
  }

  isOpen() {
    return this.#open;
  }

  closeBet() {
    if (!this.#open) return false;
    this.#open = false;
    this.#updateEmbed();
    return true;
  }

  endBet(winner) {
    switch (winner) {
      case undefined:
        this.#active = false;
        this.#updateEmbed();
        return true;
      case 1:
        this.#active = false;
        this.#winner = this.#optionOne.name;
        this.#updateEmbed();
        return [this.#getResultEmbed(), this.#optionOne.betters, this.#optionTwo.betters];
      case 2:
        this.#active = false;
        this.#winner = this.#optionTwo.name;
        this.#updateEmbed();
        return [this.#getResultEmbed(), this.#optionTwo.betters, this.#optionOne.betters];
      default:
        return false;
    }
  }
}