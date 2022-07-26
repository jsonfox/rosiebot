const { getAllChampions, getAllItems } = require('../utils/ddragon.js');
const { arrayRandom, indexRandom, countArray, pluralize } = require('../utils/helpers.js');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mergeImg = require('merge-img');
const Jimp = require('jimp');
const axios = require('axios');

exports.run = async (client, interaction) => {
  // Destructure and initialize variables
  const { emojis } = client.container;
  const { _subcommand, _hoistedOptions } = interaction.options
  const replyEmbed = new EmbedBuilder().setColor(interaction.settings.embedColor);
  const replyFiles = [];

  // Quickchart API
  const getBarChart = ({ label, x_labels, data }) =>
    encodeURI(`https://quickchart.io/chart?bkg=white&c={type:'bar',data:{labels:[${x_labels}],datasets:[{label:'${label}',data:[${data}]}]}}`);

  switch (_subcommand) {
    // Get random League of Legends Champion
    case 'champion':
      const champList = await getAllChampions();
      const { name, alias, id } = arrayRandom(champList);
      replyEmbed
        .setAuthor({ name: 'View on U.GG', url: `https://u.gg/lol/champions/${alias}/build` })
        .setTitle(name)
        // .setDescription(title.charAt(0).toUpperCase() + title.slice(1))
        .setThumbnail('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/' + id + '.png')
      break;
    // Get random League of Legends item build
    case 'items':
      const getImgUrl = ({ iconPath }) => 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/' + iconPath.split('/').at(-1).toLowerCase();
      const items = await getAllItems();
      const { boots, mythic, legendary } = items;
      const build = [];
      let buildName = '';
      let randInd = indexRandom(boots);
      build.push(getImgUrl(boots[randInd]));
      buildName += '🥾 ' + boots[randInd].name + '\n';
      randInd = indexRandom(mythic);
      build.push(getImgUrl(mythic[randInd]));
      buildName += '👑 ' + mythic[randInd].name + '\n';
      let legendaryItems = legendary.filter(({ name }) => name !== 'The Golden Spatula');
      const manaItems = ["Winter's Approach", "Manamune", "Archangel's Staff"];
      const penItems = ["Serylda's Grudge", "Lord Dominik's Regards"];
      for (let i = 0; i < 4; i++) {
        randInd = indexRandom(legendaryItems);
        const [item] = legendaryItems.splice(randInd, 1);
        if (manaItems.includes(item)) legendaryItems = legendaryItems.filter(({ name }) => manaItems.includes(name));
        if (penItems.includes(item)) legendaryItems = legendaryItems.filter(({ name }) => penItems.includes(name));
        build.push(getImgUrl(item));
        buildName += '⚔ ' + item.name + '\n';
      }
      const buffers = await Promise.all(build.map(async (url) => {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return response.data;
      }));
      const buildImg = await mergeImg(buffers);
      const buildAtt = new AttachmentBuilder();
      await new Promise((resolve, reject) => {
        buildImg.getBuffer(Jimp.MIME_PNG, (err, buff) =>
          err ? reject(err) : resolve(buildAtt.setFile(buff).setName('items.png').setDescription('Randomized LoL item build')))
      });
      buildImg.getBuffer('image/png', (err, buff) => {
        buildAtt.setFile(buff).setName('items.png')
      });
      replyFiles.push(buildAtt);
      replyEmbed
        .setTitle(buildName)
        .setImage('attachment://items.png')
      break;
    // TODO: Runes builder with cdragon
    case 'runes':
      throw new Error('This command has not been implemented yet');
    // Flip a coin <1-50> times, default 1
    case 'coinflip':
      const flip = () => Math.ceil(Math.random() * 2);
      const emojiH = emojis('heads');
      const emojiT = emojis('tails');
      const flipsInput = _hoistedOptions[0]?.value;
      const numFlips = flipsInput > 0 && flipsInput <= 50 ? flipsInput : 1;
      const flipResults = [];
      for (let i = 0; i < numFlips; i++) flipResults.push(flip());
      if (flipResults.length === 1) {
        const flipValue = flipResults[0] === 1 ? 'heads' : 'tails';
        replyEmbed
          .setTitle(`Flipped a coin and got ${flipValue}`)
          .setThumbnail(`https://cdn.discordapp.com/emojis/${emojis(flipValue).id}.webp?size=44`)
      } else {
        replyEmbed.setDescription(flipResults.map(r => r === 1 ? emojiH : emojiT).join(''));
        flipResults.sort((a, b) => a - b);
        const flipCount = countArray(flipResults);
        replyEmbed
          .setTitle(`Flipped a coin ${flipResults.length} times`)
          .addFields([{ name: 'Results', value: `Heads: ${emojiH}x${flipCount['1'] || 0}\nTails: ${emojiT}x${flipCount['2'] || 0}` }]);
      }
      break;
    // Roll <3-20>-sided die <1-50> times, default 2
    case 'diceroll':
      const roll = (sides) => Math.ceil(Math.random() * sides);
      let sidesInput, rollsInput;
      _hoistedOptions?.forEach(({ name, value }) =>
        name === 'sides' ?
          sidesInput = value > 2 && value < 99 ? value : 6
          : rollsInput = value > 0 && value <= 50 ? value : 2
      );
      sidesInput ??= 6;
      rollsInput ??= 2;
      const rollResults = [];
      for (let i = 0; i < rollsInput; i++) rollResults.push(roll(sidesInput));
      replyEmbed
        .setTitle(`Rolled a ${sidesInput}-sided die ${rollResults.length} ${pluralize('time', rollResults)}`)
        .setDescription(rollResults.map(n => `[${n}]`).join(''));
      if (rollResults.length > 5) {
        rollResults.sort((a, b) => a - b);
        const rollCount = countArray(rollResults);
        const rollGraph = getBarChart({
          label: 'Roll',
          x_labels: Object.keys(rollCount),
          data: Object.values(rollCount)
        })
        replyEmbed.setImage(rollGraph);
      }
      break;
    default: throw new Error('Invalid option');
  }

  await interaction.reply({ embeds: [replyEmbed], files: replyFiles });
}

exports.cmd = {
  "name": "random",
  "description": "Get a random thing",
  "dm_permission": true,
  "options": [
    {
      "type": 1,
      "name": "champion",
      "description": "Get a random League of Legends champion"
    },
    {
      "type": 1,
      "name": "items",
      "description": "Get a random League of Legends item build"
    },
    {
      "type": 1,
      "name": "coinflip",
      "description": "Flip a coin, heads or tails",
      "options": [
        {
          "type": 4,
          "name": "amount",
          "description": "Number of coins to flip (1-50, default 1)"
        }
      ]
    },
    {
      "type": 1,
      "name": "diceroll",
      "description": "Roll the dice",
      "options": [
        {
          "type": 4,
          "name": "sides",
          "description": "Number of sides on the die (4-20, default 6)"
        },
        {
          "type": 4,
          "name": "amount",
          "description": "Number of dice to roll (1-50, default 2)"
        }
      ]
    }
  ]
}