const configureWebRTC = (io) => {
    io.on('connection', (socket) => {
        socket.on('offer', (data) => {
            socket.to(data.target).emit('offer', {
                sdp: data.sdp,
                sender: socket.id,
            });
        });

        socket.on('answer', (data) => {
            socket.to(data.target).emit('answer', {
                sdp: data.sdp,
                sender: socket.id,
            });
        });

        socket.on('ice-candidate', (data) => {
            socket.to(data.target).emit('ice-candidate', {
                candidate: data.candidate,
                sender: socket.id,
            });
        });
    });
};

module.exports = {
    configureWebRTC,
};
