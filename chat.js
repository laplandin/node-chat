module.exports = function(app, io) {

    var state = {
        clientsOnline: [],
        rooms: [],
        getUserNames: function(arr) {
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
            roommatesList.push(userName);
        }
        console.log(roommatesList);
        return roommatesList;
    }

    function getSocketByUsername(username) {
        for (socket in io.sockets.connected) {
            if (io.sockets.connected[socket].handshake.query.name == username) {
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
            state.clientsOnline.push(client);
            client.join('common');
            client.emit('get_online_users', state.getUserNames());

            client.to('common').emit('change_client', {
                name : client.handshake.query.name,
                connect : true
            });

            client.on('disconnect', function(arg) {
                var i = state.clientsOnline.indexOf(client);
                state.clientsOnline.splice(i, 1);
                client.to('common').emit('change_client', {
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
    });
};
