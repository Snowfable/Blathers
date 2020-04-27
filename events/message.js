const cooldowns = new Discord.Collection();

module.exports = async (client, message) => {
	if (!message.guild || message.author.bot) return;
	if (!message.channel.permissionsFor(message.guild.me).has([ 'SEND_MESSAGES', 'EMBED_LINKS' ])) return;
	//Bot is Mentioned
	if (message.mentions.has(client.user)) {
		if (message.mentions.everyone) return;
		return message.reply('Hey there! My prefix is `;`. Use the `;help` command to find out more about me!');
	}

	// Start Leveling
	let score;
	score = client.getScore.get(message.author.id, message.guild.id);
	if (!score) {
		score = {
			id: `${message.guild.id}-${message.author.id}`,
			user: message.author.id,
			guild: message.guild.id,
			name: message.author.username,
			points: 0,
			level: 1
		};
	}
	score.name = message.author.username;
	score.points++;
	const curLevel = Math.floor(0.2 * Math.sqrt(score.points));
	if (score.level < curLevel) {
		score.level++;
		//	embed = new Discord.MessageEmbed()
		//		.setDescription(
		//			`<@${message.author
		//				.id}>, You've leveled up to level **${curLevel}**! Ain't that dandy? <a:leafrainbow:700145511012761690>`
		//		)
		//		.setColor(client.getRandomColor());
		//	message.channel.send(embed);
	}
	client.setScore.run(score);

	//Start Command Lookup
	if (message.content.indexOf(';') !== 0) return;
	//const level = client.permLevel(message);
	const args = message.content.slice(';'.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));
	if (!cmd) return;

	// Check If Commands Disabled
	if (cmd.conf.enabled === false) {
		if (level[1] < 2) {
			return client.error(
				message.channel,
				'Command Disabled',
				`This command is currently disabled. Please visit the Support Server for more information by typing \`;info\``
			);
		}
	}

	// Check Perm Level
	if (level[1] < client.levelCache[cmd.conf.permLevel]) {
		return client.error(
			message.channel,
			'Invalid Permissions!',
			`You do not currently have the proper permssions to run this command!\n**Current Level:** \`${level[0]}: Level ${level[1]}\`\n**Level Required:** \`${cmd
				.conf.permLevel}: Level ${client.levelCache[cmd.conf.permLevel]}\``
		);
	}

	if (!cooldowns.has(cmd.help.name)) {
		cooldowns.set(cmd.help.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(cmd.help.name);
	const cooldownAmount = (cmd.conf.cooldown || 0) * 1000;

	if (timestamps.has(message.author.id)) {
		if (level[1] < 2) {
			const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

			if (now < expirationTime) {
				let timeLeft = (expirationTime - now) / 1000;
				let time = 'second(s)';
				if (cmd.conf.cooldown > 60) {
					timeLeft = (expirationTime - now) / 60000;
					time = 'minute(s)';
				}
				return client.error(
					message.channel,
					'Woah There Bucko!',
					`Please wait **${timeLeft.toFixed(2)} more ${time}** before reusing the \`${cmd.help
						.name}\` command!`
				);
			}
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	cmd.run(client, message, args, Discord);
};
