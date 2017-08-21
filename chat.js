module.exports = function(app, io) {

  var state = {
    clientsOnline: [],
    rooms: [],
    getUserNames: function(arr) {
      var namesArr = this.clientsOnline.map(function(current, index, array) {
        return current.handshake.query.name;
      });
      return namesArr;
    }
  };

  io.sockets.on('connection', function(client) {
    if (client.handshake.query.roomID) {
      var roomID = client.handshake.query.roomID;
      state.rooms.push(roomID);
      client.join(roomID);
    }

    state.clientsOnline.push(client);
    client.emit('get_online_users', state.getUserNames());

    client.broadcast.emit('change_client', {
      name : client.handshake.query.name,
      connect : true
    });

    client.on('disconnect', function(arg) {
      console.log(this);
      var i = state.clientsOnline.indexOf(client);
      state.clientsOnline.splice(i, 1);
      client.broadcast.emit('change_client', {
        name : client.handshake.query.name,
        connect : false
      });
    });

    client.on('message', function(message) {

      try {
        client.emit('message', message);
        client.broadcast.emit('message', message);
      } catch (e) {
        console.log(e);
        client.disconnect();
      }
    });
  });
}
