const socket = io();
let username = '';
let room = '';
let typingTimer;

document.getElementById('join-btn').addEventListener('click', () => {
    username = document.getElementById('username').value.trim();
    let customRoom = document.getElementById('new-room').value.trim();
    
    
    room = customRoom !== '' ? customRoom : document.getElementById('room').value;
    
    if (username === '') return alert('Nickname daal bhai!');

    socket.emit('join', { username, room });
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'flex';
    document.getElementById('room-name').textContent = room;
});

// Send message
document.getElementById('send-btn').addEventListener('click', sendMsg);
document.getElementById('message').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMsg();
    
    // Typing indicator
    socket.emit('typing', { username, room });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => socket.emit('stop_typing', { room }), 1000);
});

function sendMsg() {
    const msg = document.getElementById('message').value.trim();
    if (msg !== '') {
        socket.emit('message', { username, room, message: msg });
        document.getElementById('message').value = '';
        socket.emit('stop_typing', { room });
    }
}

// Receive message + timestamp + Sent status
socket.on('message', (data) => {
    const div = document.createElement('div');
    div.className = 'msg' + (data.username === username ? ' you' : '');
    div.innerHTML = `<b>${data.username}</b>: ${data.message}
                     <span class="time">${data.time}</span>
                     <span class="status">✓ ${data.status}</span>`;
    document.getElementById('messages').appendChild(div);
    scrollToBottom();
});

// Join/Leave status
socket.on('status', (data) => {
    const p = document.createElement('div');
    p.className = 'status-msg';
    p.textContent = `${data.msg} • ${data.time}`;
    document.getElementById('messages').appendChild(p);
    scrollToBottom();
});

// Online users list
socket.on('users_list', (data) => {
    const ul = document.getElementById('users-list');
    ul.innerHTML = '';
    data.users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u + (u === username ? ' (You)' : '');
        ul.appendChild(li);
    });
});

// Typing indicator
socket.on('typing', (data) => {
    document.getElementById('typing-indicator').textContent = `${data.username} is typing...`;
});
socket.on('stop_typing', () => {
    document.getElementById('typing-indicator').textContent = '';
});

function scrollToBottom() {
    const msgBox = document.getElementById('messages');
    msgBox.scrollTop = msgBox.scrollHeight;
}
