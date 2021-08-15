const express = require("express");
const starboardInterface = require("../starboard-interface.js");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res) {
	console.log(starboardInterface.getAllStarredMessages());
	starboardInterface.getAllStarredUsers().then(starredUsers => {
		starboardInterface.getAllStarredMessages().then(starredMessages => {
			console.log(starredMessages);
			// Establish User-Message Ownership (a bit heavy handed but whatever)
			let starredUserMessageMap = {};
			for(let i=0; i<starredUsers.length; i++){
				for(let j=0; j<starredMessages.length; j++){
					if(starredUsers[i].id == starredMessages[j].user){
						if(!(starredUsers[i].id in starredUserMessageMap)){
							starredUserMessageMap[starredUsers[i].id] = [{user: starredUsers[i], message: starredMessages[j]}]	
						}
						else{
							starredUserMessageMap[starredUsers[i].id].push({user: starredUsers[i], message: starredMessages[j]});
						}
					}
				} 
			}
			console.log(starredUserMessageMap);
			res.render("leaderboard",{title: "Starboard Web", starredUserMessageMap:starredUserMessageMap});
		});
	});
});

module.exports = router;
