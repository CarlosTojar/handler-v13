// ! Modulos. ! //
const { Discord, Client, Collection } = require('discord.js'); // ? Discord.js v13.
const config = require('./config/config.json'); // ? Config bot.
const fs = require('fs'); // ? Fs.
const Enmap = require('enmap'); // ? Enmap.

// ! Client. ! //
const client = new Client({
    messageCacheLifeTIme: 60,
    fetchAllMembers: true,
    messageCacheMaxSize: 10,
    shards: 'auto',
    shardCount: 5,
    disableEveryone: true,
    patrials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

// ! Database. ! //

client.commands = new Collection();
client.aliases = new Collection();
const cooldowns = new Collection();

client.settings = new Enmap({
    name: 'settings'
});
client.categories = fs.readdirSync('./commands/');

['command'].forEach(handler => {
    require(`./handlers/command`)(client);
});
const eventhandler = require(`./handlers/events`);
eventhandler(client);

// ! Suggest ! //

const suggest = require('./modules/suggest');
suggest(client);

// ! MessageCreate ! //

client.on('messageCreate', async message => {

    if(message.author.bot) return;
    if(!message.guild) return;

    client.settings.ensure(message.guild.id, {
        prefix: ">>",
        channel: "",
        command: "feedback",
        approvemsg: "✅ Accepted Idea! Expect this soon.",
        denymsg: "❌ Thank you for the feedback, but we are not interested in this idea at this time.",
        maybemsg: "<:Messageadd:988138512832401438> We are thinking about this idea!",
        statustext: "<:Messageadd:988138512832401438> Waiting for Community Feedback, please vote!",
        footertext: "Want to suggest / Feedback something? Simply type in this channel!",
        approveemoji: "988133636220010606",
        denyemoji: "❌",
        role: "",
    });

    let prefix = client.settings.get(message.guild.id, 'prefix');

    if(!message.content.startsWith(prefix)&& message.content.startsWith(client.user.id)) message.reply(`My Prefix is: **\`${prefix}\`**, tpye \`${prefix}help\` for more information!`);
    if (!message.content.startsWith(prefix)) return; 
    const args = message.content.slice(prefix.length).trim().split(/ +/g); 
    const cmd = args.shift().toLowerCase(); 
    
    if(!message.content.startsWith(prefix) || cmd.length === 0) return;
    else{
        try{
            message.react("")
        }catch{}
    }
    if (message.content.includes(client.user.id)) {
       return message.reply(
        new Discord.MessageEmbed()
       .setColor("#ff712e")
       .setAuthor(`${message.author.username}, My Prefix is ${prefix}, to get started; type ${prefix}help`, message.author.displayAvatarURL({ dynamic: true })));
    }
    
    let command = client.commands.get(cmd); 
    if (!command) command = client.commands.get(client.aliases.get(cmd)); 

   
    if (command) 
    {
        if (!cooldowns.has(command.name)) { 
            cooldowns.set(command.name, new Collection());
        }
        
        const now = Date.now(); 
        const timestamps = cooldowns.get(command.name); 
        const cooldownAmount = (command.cooldown || 1) * 1000; 
      
        if (timestamps.has(message.author.id)) { 
          const expirationTime = timestamps.get(message.author.id) + cooldownAmount; 
      
          if (now < expirationTime) { 
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply( 
              `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
            ); 
          }
        }
      
        timestamps.set(message.author.id, now); 
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount); 
      try{
        command.run(client, message, args, message.author, args.join(" "), prefix); 

      }catch (error){
        console.log(error)
        return message.reply("Something went wrong while, running the: `" + command.name + "` command")
      }
    } 
    else 
    return message.reply(`Unkown command, try: **\`${prefix}help\`**`)
    
});

client.login(config.TOKEN);
