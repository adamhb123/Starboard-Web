const starboard = require("./starboard/index");
const secrets = require("./starboard/secrets.json");
const db = require("better-sqlite3")(`${__dirname}/starboard/starboard.db`);

class User {
	constructor(id, name, image){
		this.id = id;
		this.name = name;
		this.image = image;
	}
	equals(other){
		if(!(other instanceof User)) return false;
		return this.name == other.name && this.image == other.image
	}
}

// Most functions could be moved to starboard's index.js, maybe they
// even should be, but for now I think it is a good idea to keep
// functions the bot doesn't actually use out of there and in here
async function getMessage(id, ts) {
	try {
		const result = await starboard.app.client.conversations.history({
			token: secrets.slackToken,
			channel: id,
			latest: ts,
			inclusive: true,
			limit: 1
		});
		message = result.messages[0];
		return message;
	} catch (err) {
		console.error(`Failed to get message: ${err}`);
	}
}

async function _getAllStarredMessagesInDB(){
	try{
		const res = db.prepare("SELECT messageId, channelId FROM stars").all();
		if(res){
			return res;
		}
	} catch (err){
		console.error(`Failed to get all starred messages: ${err}`);
	}
}

async function getUserInfo(authorId){
	try {
		const result = await starboard.app.client.users.profile.get({
			token: secrets.slackToken,
			include_labels: false,
			user: authorId
		});
		// Add authorId to result
		result.authorId = authorId;
		return result;
	} catch (err) {
		console.error(`Failed to get message: ${err}`);
	
	}
}

async function getAllStarredUsers(uniqueOnly=true){
	let messages = await getAllStarredMessages();
	if(messages){
		let users = [] 
		for(let i = 0; i < messages.length; i++){
			if(uniqueOnly){
				let userInList = false;
				// Check user already in list
				for(let j=0; j<users.length; j++){
					if(users[j].id === messages[i].user){
						userInList = true;
						break;
					}	
				}
				if(userInList) continue;
			}
			let userInfo = await getUserInfo(messages[i].user);
			if(userInfo){
				let profile = userInfo.profile;
				users.push(new User(userInfo.authorId, profile.display_name ? profile.display_name : profile.real_name, profile.image_32));
			}
		}
		return users;
	}
}

async function getAllStarredMessages(ordered=true){
	let messagesInfo = await _getAllStarredMessagesInDB();
	if(messagesInfo){
		messages = []
		for(let i = 0; i < messagesInfo.length; i++){
			// Check if message is a repeat
			if(messages.find(message => message.ts == messagesInfo[i].messageId) != null){
				continue;
			}
			let message = await getMessage(messagesInfo[i].channelId, messagesInfo[i].messageId);
			
			// Add permalink to message
			let permalink = await starboard.app.client.chat.getPermalink({
			      channel: messagesInfo[i].channelId,
			      message_ts: messagesInfo[i].messageId
			});
			message.permalink = permalink.permalink;
			
			messages.push(message);
		}
		if(ordered){
			console.log("FILTERED: " + JSON.stringify(messages.find(message => message.reactions.find(reaction => reaction.name === secrets.reactionName || "star"))));
			//messages.sort((a, b) => (a.reactions.find(reaction => reaction.name === secrets.reactionName || "star")).count - (b.reactions.find(reaction => reaction.name === secrets.reactionName || "star")).count);		
		}
		return messages;
	}
}

// getAllStarredUsers().then(users=>console.log(users));

module.exports = {
	getAllStarredMessages: getAllStarredMessages,
	getAllStarredUsers: getAllStarredUsers
};
