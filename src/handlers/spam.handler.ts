import { ChannelType, Collection, GuildNSFWLevel, Message } from "discord.js";
import { Handler } from "..";
import { channel } from "diagnostics_channel";

const getMessageSuspicion = async(message:Message) => {
    let suspicionLevel = 0
    const links = message.content.matchAll(/(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/g)
    if(message.content.toLowerCase().includes("nitro")) suspicionLevel += 5;
    for(const link of links){
        const url = link[0]
        suspicionLevel += 5;
    }
    const invites = message.content.matchAll(/\s*(?:https:\/\/)?(?:discord\.gg\/|discord\.com\/invite\/)[a-zA-Z0-9]+\s*/g)
    for(const inviteLink of invites){
        const invite = await message.client.fetchInvite(inviteLink[0])
        console.log(invite)
        suspicionLevel += 10
        if(invite.guild?.name.includes("18")) suspicionLevel += 20
        if(invite.guild?.nsfwLevel == GuildNSFWLevel.Explicit || invite.guild?.nsfwLevel == GuildNSFWLevel.AgeRestricted) suspicionLevel += 20
    }
    return suspicionLevel
}

export const spamHandler:Handler = (client) =>{
    client.on("messageCreate", async (message) => {
        let suspicionLevel = await getMessageSuspicion(message)
        if(suspicionLevel > 10){
            const messages:Collection<string, Message<true>> = new Collection()
            message.guild?.channels.cache.forEach( async channel => {
                if(channel.type != ChannelType.GuildText) return
                (await channel.messages.fetch({ limit: 10})).filter(msg=>msg.author==message.author).forEach((v,k)=>messages.set(k,v))
            }); 
            suspicionLevel += (await Promise.all(messages.map(getMessageSuspicion))).reduce((a,b)=>a+b)
            //TODO: consequences
            const logChannel = await message.guild?.channels.fetch(process.env.LOGS_CHANNEL)
            if(logChannel?.isTextBased()) logChannel.send(`suspicion level ${suspicionLevel} for ${message.author}, from message ${message.url}`)
        }
    })
}