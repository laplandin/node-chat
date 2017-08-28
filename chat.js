module.exports = function(app, io) {

    var state = {
        clientsOnline: [],
        rooms: [],
        getUserNames: function() {
            return this.clientsOnline.map(function(current, index, array) {
                return current.handshake.query.name;
            });
        }
    };

    function getClientsFromRoom(roomName) {
        console.log(io);
        var roommatesList = [];
        for (socket in io.sockets.adapter.rooms[roomName].sockets) {
            var userName = io.sockets.connected[socket].handshake.query.name;
            // if (user === userName) continue;
            roommatesList.push(userName);
        }
        console.log(roommatesList);
        return roommatesList;
    }

    function getSocketByUsername(username) {
        for (socket in io.sockets.connected) {
            if (io.sockets.connected[socket].handshake.query.name === username) {
                return io.sockets.connected[socket];
            }
        }
    }

    io.sockets.on('connection', function(client) {

        //for room
        if (client.handshake.query.roomID) {
            var roomID = client.handshake.query.roomID;
            var userName = client.handshake.query.name;

            state.rooms.push(roomID);
            client.join(roomID);
            // console.log()
            if (getClientsFromRoom(roomID).length === 1) client.emit('privilige', {isAdmin: true});
            console.log(io);

            client.emit('get_online_users', state.getUserNames());
            client.to(roomID).emit('get_online_users', state.getUserNames());

            client.emit('get_online_roommates', getClientsFromRoom(roomID));
            client.to(roomID).emit('get_online_roommates', getClientsFromRoom(roomID));

            client.on('invite', function(data) {
                var self = this;
                console.log(self.rooms);
                var roomID = data.roomID;
                var invitedSocket = getSocketByUsername(data.person);
                console.log(invitedSocket.id);
                invitedSocket.emit('invitation', {invitator : data.invitator, roomID: roomID});
            });

            client.on('leave', function(data) {
               var deletedSocket = getSocketByUsername(data.person);
               deletedSocket.leave(data.roomID);
               deletedSocket.emit('notify_leave', {});
            });

            client.on('message', function(message) {

                try {
                    client.to(roomID).emit('message', message);
                    client.emit('message', message);
                } catch (e) {
                    console.log(e);
                    client.disconnect();
                }
            });
        } else {

        //for common chat
            var name = client.handshake.query.name;
            if (checkName(name)) {
              console.log('invalid');

              client.on('rename', function(data) {
                console.log('valid');
                  if (checkName(data.name)) {
                      client.emit('name_invalid', {});
                  } else {
                    client.emit('name_valid', {});
                      client.handshake.query.name = data.name;
                      addCommonListeners(client);
                      console.log(name);
                  };
              });
              client.emit('name_invalid', {});
            } else {
              client.emit('name_valid', {});
              addCommonListeners(client);
            }
        }
    });

    function checkName(name) {
        var names = state.getUserNames();
        if (names.indexOf(name) < 0) {
          console.log('valid check');
          return false;
        } else {
          console.log('invalid check');
          return true;
        }
    }

    function addCommonListeners(client) {
      var name = client.handshake.query.name;
      state.clientsOnline.push(client);
      console.log('fire', state.names);
        client.join('common');


        client.emit('get_online_users', state.getUserNames());

        client.broadcast.emit('change_client', {
            name : client.handshake.query.name,
            connect : true
        });

        client.on('disconnect', function(arg) {
            var i = state.clientsOnline.indexOf(client);
            state.clientsOnline.splice(i, 1);
            client.broadcast.emit('change_client', {
                name : client.handshake.query.name,
                connect : false
            });
        });


        client.on('message', function(message) {

            try {
                client.to('common').emit('message', message);
                client.emit('message', message);
            } catch (e) {
                console.log(e);
                client.disconnect();
            }
        });
    }
};
