const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoom} = require('./utils/users');

const botname = "Talk";

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
    

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
    
        socket.join(user.room);
    
        // Welcome current user
        socket.emit('message', formatMessage(botname, 'Welcome to Talk!'));
    
        // Broadcast when a user connects
        socket.broadcast
          .to(user.room)
          .emit(
            'message',
            formatMessage(botname, `${user.username} has joined the chat`)
          );

          //send user info when connects
         io.to(user.room).emit('roomUsers',{
              room: user.room,
              users: getRoom(user.room)
          })
    
          });

    
    // listen chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io
        .to(user.room)
        .emit('message',formatMessage(user.username, msg));
    })
    
    //when user disconnect the chat
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
    
        if(user){
            io.to(user.room).emit("message", formatMessage(botname, `${user.username} left the chat`));
        
        //send room and user info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users: getRoom(user.room)
        })
    }
    })
})

const PORT = 3000;
server.listen(PORT, () => {
    console.log("server is running at port 3000");
})