$(document).ready(function () {
    var name;
    var socket;
    var url = 'http://localhost:8008';
    var usersOnline = [];
    var isAdmin = false;
    var href = decodeURIComponent(window.location.href);
    var pathname = decodeURIComponent(window.location.pathname);

    if (/room/.test(href)) {
        var roomID = Number(pathname.match(/\/room\/(\d+)/)[1]);
    try {
        name = href.match(/\?.+/)[0];
        console.log(name);
        name = name.slice(1);

        socket = io.connect(url, {query: 'name=' + name + '&roomID=' + roomID});

        socket.on('get_online_roommates', function(roommatesList) {
            renderOnlineUsers(roommatesList);
        });
    } catch(e) {

        alert('кажется вас сюда никто не приглашал');
        $('body').html('<h1>Страница заблокирована до выяснения обстоятельств</h1>');
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

    socket.on('invitation', function(data) {
       if (confirm('вас приглашает в беседу ' + data.invitator)) {
           var url = window.location.href + 'room/' + data.roomID + '?' + name;
           console.log(url);
           var win = window.open(url, '_blank');

           if (win) {
               //Переходы на табы разрешены
               win.focus();
           } else {
               //Если окно заблокировано
               alert('Пожалуйста разрешите переход на страницу приватного чата');
           }
       }
    });

    socket.on('notify_leave', function() {
       alert('Вы были удалены из этого приватного чата администратором');
       $('body').html('<h1>Всего наилучшего</h1><p>Вы можете вернуться в общий <a href="http://localhost:8008">чат</a> или создать свою <a href="http://localhost:8008/create">приватную комнату</ahref></p>')
    });

    socket.on('privilige', function(data) {
        console.log('privi');
       if (typeof data.isAdmin === 'boolean' && data.isAdmin) {
           isAdmin = true;
           console.log('admin here');
       }
       renderOnlineUsers();
    });

    function renderOnlineUsers(roommates) {
        var list;
        if (roommates) {
            list = $('.roommates-online').html('');
            if (isAdmin) {
                console.log(isAdmin);
                roommates.forEach(function(item) {
                    if (item === name) {
                        list.append('<li class="roommate-online">' + item + '</li>');
                    } else {
                        var str = '<li class="roommate-online"> <a class="user-link" href="#">' + item + '</a> </li>';
                        var newListElement = $(str).data('username', item);
                        addInviteHandler(newListElement, 'leave');
                        list.append(newListElement);
                    }
                });
            } else {
                roommates.forEach(function(item) {
                    list.append('<li class="roommate-online">' + item + '</li>');
                });
            }
        } else {
            list = $('.users-online').html('');
            usersOnline.forEach(function(item) {
                var str = '';
                var element;
                if (window.location.href.match(/room/)) {
                    if (isAdmin) {
                        str = '<li class="user-online"> <a class="user-link" href="#">' + item + '</a> </li>';
                        if (item === name) str = '<li class="user-online">' + item + '</li>';
                        element = $(str).data('username', item);
                        addInviteHandler(element, 'invite');
                    } else {
                        element = $('<li class="user-online">' + item + '</li>');
                    }
                } else {
                    str = '<li class="user-online">' + item + '</li>';
                    element = $(str);
                }
                list.append(element);
            });
        }
    }

    function addInviteHandler(elem, ev) {
        elem.on('click', function(e) {
            e.preventDefault();
            var person = $(this).data('username');
            console.log(person);
            socket.emit(ev, {person : person, invitator: name, roomID: roomID});
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
