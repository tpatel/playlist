
var playlists = {};

function randomString(length) {
	return Math.floor(Math.random()*Math.pow(10,length));
}

exports.newRoom = function(req, res){
	var a = randomString(12);
	while(playlists[a]) {
		a = randomString(12);
	}
	playlists[a] = {id:Object.keys(playlists).length, creation:+new Date(), queue:[], current: null};
	playlists[a].roomId = playlists[a].id + '' + randomString(8);
	res.redirect('/r/'+a);
};

exports.admin = function(req, res) {
	var id = req.params.id;
	if(id && playlists[id]) {
		res.render('admin', {clientUrl: '/c/'+playlists[id].roomId,roomId:playlists[id].roomId});
		console.log(playlists);
	} else {
		res.redirect('/');
	}
	
};

function getRoomPlayList(id) {
	for(var i in playlists) { //TODO:Remplace by the DB
		if(playlists[i].roomId == id) {
			return playlists[i];
		}
	}
	return null;
}

exports.client = function(req, res) {
	var id = req.params.id;
	if(id) {
		var room = getRoomPlayList(id);
		if(room) {
			res.render('client', {roomId:id});
		} else {
			res.redirect('/');
		}
	} else {
		res.redirect('/');
	}
	
};

function getVideo(queue, url) {
	for(var i in queue) { //TODO:Remplace by the DB
		if(queue[i].url == url) {
			return queue[i];
		}
	}
	return null;
}

exports.setUpSocketIO = function(io) {
	
	io.sockets.on('connection', function (socket) {
		socket.on('subscribe', function(data) {
			socket.join(data.room);
			var pl = getRoomPlayList(data.room);
			console.log('suscribe', data, pl);
			socket.set('room', data.room);
			if(pl) {
				io.sockets.in(data.room).emit('videoList', pl);
			}
		});
		socket.on('playingVideo', function(data) {
			var pl = getRoomPlayList(data.room);
			pl.current = data.url;
			if(data.url) {
				var queue = pl.queue;
				for(var i in queue) {
					if(queue[i].url = data.url) {
						queue.splice(i,1); //remove video from queue
						break;
					}
				}
			}
			io.sockets.in(data.room).emit('videoList', pl);
		});
		socket.on('newVideo', function (data) {
			console.log(data);
			if(!data.url) return;
			socket.get('room', function (err, room) {
				if(err) {
					console.log('E: socket.io get room', err);
				} else {
					console.log('room : ',room);

					//Update playlist
					var playlist = getRoomPlayList(room);
					var url = data.url;
					
					//Is it currently playing ?
					if(playlist.current == url) return;

					//Is already in the list ?
					var video = getVideo(playlist.queue, url);
					if(video) {
						//update votes
						if(video.votes[socket.id]) //already voted
							return;
						video.votes[socket.id] = 1; //Unique Id of the user
					} else {
						//add the video
						video = {url:url, creation:+new Date(), votes:{}};
						video.votes[socket.id] = 1;
						playlist.queue.push(video);
					}

					//sort again the list
					playlist.queue.sort(function(a, b) { //[].sort(function(a,b){return b-a}); numerically descendant
						var aVotes = Object.keys(a.votes).length;
						var bVotes = Object.keys(b.votes).length;
						if(aVotes == bVotes) {
							return a.creation-b.creation; //ascendent considering time
						} else {
							return bVotes-aVotes; //descendent considering votes
						}
					});
					
					//FIXME: anonymiser les votes avant l'envoie
					//Send updated playlist
					io.sockets.in(room).emit('videoList', playlist);
				}
			});
		});
	});
	
};
