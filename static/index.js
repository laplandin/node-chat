$(document).ready(function () {
    var name;
    var socket;
    var url = 'http://localhost:8008';
    var usersOnline = [];
    var isInvited = false;

    if (/room/.test(window.location.href)) {
        name = localStorage.getItem('name');
        // if (!name) getUserName();
        var roomID = Number(window.location.pathname.match(/\/room\/(\d+)$/)[1]);
    try {
        name = window.location.href.match(/\?.+/)[0];
        console.log(name);
        name = name.slice(1);
        isInvited = true;
    } catch(e) {

        alert('кажется вас сюда никто не приглашал');
        $('body').html('<h1>Страница заблокирована до выяснения обстоятельств</h1>');
    }

    if (isInvited) {
        socket = io.connect(url, {query: 'name=' + name + '&roomID=' + roomID});

        socket.on('get_online_roommates', function(roommatesList) {
            renderOnlineUsers(roommatesList);
        });
    }

    } else  {
        getUserName();
        socket = io.connect(url, {query: 'name=' + name});
    }

    function getUserName() {
        while(!name) {
            name = prompt('Ваше имя', '');
            $('.js-create-link').attr('href', '/create?name=' + name);
        }
    }

    var messages = $("#messages");
    var message_txt = $("#message_text");
    $('.chat .nick').text(name);

    function msg(nick, message) {
        var m = '<div class="msg">' +
            '<span class="user">' + safe(nick) + ':</span> '
            + safe(message) +
            '</div>';
        messages
            .append(m)
            .scrollTop(messages[0].scrollHeight);
    }

    function msg_system(message) {
        var m = '<div class="msg system">' + safe(message) + '</div>';
        messages
            .append(m)
            .scrollTop(messages[0].scrollHeight);
    }

    socket.on('connecting', function () {
        msg_system('Соединение...');
    });

    socket.on('connect', function () {
        msg_system('Соединение установлено!');
    });

    socket.on('message', function (data) {
        msg(data.name, data.message);
        message_txt.focus();
    });

    socket.on('change_client', function(data) {
        if (data.connect) {
            console.log('added');
            msg_system('К нам присоединился ' + data.name);
            usersOnline.push(data.name);
            renderOnlineUsers();
        } else {
            console.log('removed');
            msg_system('Нас покинул ' + data.name);
            var i = usersOnline.indexOf(data.name);
            usersOnline.splice(i, 1);
            renderOnlineUsers();
        }
    });

    socket.on('get_online_users', function(data) {
        console.log('get on connection');
        if ($.isArray(data) && data.length) {
            usersOnline = data;
            renderOnlineUsers();
        }
    });

    function renderOnlineUsers(roommates) {
        if (roommates) {
            var list = $('.roommates-online').html('');
            roommates.forEach(function(item) {
                var str = '<li class="roommate-online">' + item + '</li>';
                list.append(str);
            });
        } else {
            var list = $('.users-online').html('');
            usersOnline.forEach(function(item) {
                var str = '<li class="user-online"> <a class="user-link" href="#">' + item + '</a> </li>';
                var newUserElement = $(str).data('username', item);
                addInviteHandler(newUserElement);
                list.append(newUserElement);
            });
        }
    }

    function addInviteHandler(elem) {
        elem.on('click', function(e) {
            e.preventDefault();
            var invitedPerson = $(this).data('username');
            socket.emit('invite', {'invitedPerson' : invitedPerson});
        });
    }



    $(document).on('keypress', function(e) {
        if ((e.keyCode == 13) || (e.which == 13)) {
            sendMessage();
        }
    });

    $("#message_btn").click(function () {
        sendMessage();
    });

    function sendMessage() {
        var message = $("#message_text").val();
        if (!message) return;
        message_txt.val("");
        socket.emit("message", {message: message, name: name});
    }

    function safe(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
});
