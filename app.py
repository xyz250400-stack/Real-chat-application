from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secretkey123'
socketio = SocketIO(app, cors_allowed_origins="*")

# Store room wise users: {room_name: {sid: username}}
rooms = {
    'General': {},
    'Tech': {},
    'Random': {}
}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join')
def handle_join(data):
    username = data['username']
    room = data['room']
    join_room(room)

    # Store user in room
    rooms[room][request.sid] = username

    # 1. Join status message
    emit('status', {
        'msg': f'{username} joined the room',
        'time': datetime.now().strftime('%H:%M')
    }, room=room)

    # 2. Update user list for everyone in room
    emit('users_list', {
        'users': list(rooms[room].values())
    }, room=room)

@socketio.on('message')
def handle_message(data):
    room = data['room']
    username = data['username']
    msg = data['message']
    time = datetime.now().strftime('%H:%M')

    emit('message', {
        'username': username,
        'message': msg,
        'time': time,
        'status': 'Sent'
    }, room=room)

@socketio.on('typing')
def handle_typing(data):
    room = data['room']
    username = data['username']
    emit('typing', {'username': username}, room=room, include_self=False)

@socketio.on('stop_typing')
def handle_stop_typing(data):
    room = data['room']
    emit('stop_typing', {}, room=room, include_self=False)

@socketio.on('disconnect')
def handle_disconnect():
    # Find which room user was in and remove
    for room, users in rooms.items():
        if request.sid in users:
            username = users[request.sid]
            del users[request.sid]
            leave_room(room)

            # 1. Leave status message
            emit('status', {
                'msg': f'{username} left the room',
                'time': datetime.now().strftime('%H:%M')
            }, room=room)

            # 2. Update user list after leaving
            emit('users_list', {
                'users': list(users.values())
            }, room=room)
            break

if __name__ == '__main__':
    socketio.run(app, debug=True)
