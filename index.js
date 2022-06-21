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

    if(!message.content.startsWith(prefix)&& message.content.startsWith(client.user.id)) message.reply(`My Prefix is: **\`${prefix}\`**, tpye \`${prefix}help\` for more information!`); //if the messages is not a command and someone tags the bot, then send an info msg
    if (!message.content.startsWith(prefix)) return; //if the message does not starts with the prefix, return, so only commands are fired!
    
    const args = message.content.slice(prefix.length).trim().split(/ +/g); //creating the argumest (each space == 1 arg)
    const cmd = args.shift().toLowerCase(); //creating the cmd argument by shifting the args by 1
    
    if(!message.content.startsWith(prefix) || cmd.length === 0) return;
    else{
        try{
            message.react("")
        }catch{}
    }
    if (message.content.includes(client.user.id)) { //if message contains musicium as a ping
       return message.reply(new Discord.MessageEmbed().setColor("#ff712e").setAuthor(`${message.author.username}, My Prefix is ${prefix}, to get started; type ${prefix}help`, message.author.displayAvatarURL({ dynamic: true }), "https://su.musicium.eu"));
    }
    
    let command = client.commands.get(cmd); //get the command from the collection
    if (!command) command = client.commands.get(client.aliases.get(cmd)); //if the command does not exist, try to get it by his alias

   
    if (command) //if the command is now valid
    {
        if (!cooldowns.has(command.name)) { //if its not in the cooldown, set it too there
            cooldowns.set(command.name, new Collection());
        }
        
        const now = Date.now(); //get the current time
        const timestamps = cooldowns.get(command.name); //get the timestamp of the last used commands
        const cooldownAmount = (command.cooldown || 1) * 1000; //get the cooldownamount of the command, if there is no cooldown there will be automatically 1 sec cooldown, so you cannot spam it^^
      
        if (timestamps.has(message.author.id)) { //if the user is on cooldown
          const expirationTime = timestamps.get(message.author.id) + cooldownAmount; //get the amount of time he needs to wait until he can run the cmd again
      
          if (now < expirationTime) { //if he is still on cooldonw
            const timeLeft = (expirationTime - now) / 1000; //get the lefttime
            return message.reply( 
              `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
            ); //send an information message
          }
        }
      
        timestamps.set(message.author.id, now); //if he is not on cooldown, set it to the cooldown
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount); //set a timeout function with the cooldown, so it gets deleted later on again
      try{
        command.run(client, message, args, message.author, args.join(" "), prefix); //run the command with the parameters:  client, message, args, user, text, prefix, 

      }catch (error){
        console.log(error)
        return message.reply("Something went wrong while, running the: `" + command.name + "` command")
      }
    } 
    else 
    return message.reply(`Unkown command, try: **\`${prefix}help\`**`)
    
});

client.login(config.TOKEN);