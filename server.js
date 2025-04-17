const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const usuarios = {}; // { sala1: ['João', 'Maria'], sala2: [...] }

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Novo usuário conectado', socket.nome);

    socket.on('entrarNaSala', ({ nome, sala }) => {
        socket.join(sala);
        socket.nome = nome;
        socket.sala = sala;

        console.log(' O usuário', socket.nome, 'conectou-se a sala', socket.sala);

        if (!usuarios[sala]) usuarios[sala] = [];
        if (!usuarios[sala].includes(nome)) usuarios[sala].push(nome);

        socket.emit('mensagem', {
            nome: 'Sistema',
            texto: `Bem-vindo à sala ${sala}`,
        });

        socket.to(sala).emit('mensagem', {
            nome: 'Sistema',
            texto: `${nome} entrou na sala.`,
        });

        io.to(sala).emit('usuariosAtivos', usuarios[sala]);
    });

    socket.on('mensagem', ({ nome, texto }) => {
        io.to(socket.sala).emit('mensagem', { nome, texto });
    });

    socket.on('disconnect', () => {
        const { nome, sala } = socket;
        if (nome && sala && usuarios[sala]) {
            usuarios[sala] = usuarios[sala].filter((n) => n !== nome);

            socket.to(sala).emit('mensagem', {
                nome: 'Sistema',
                texto: `${nome} saiu da sala.`,
            });

            io.to(sala).emit('usuariosAtivos', usuarios[sala]);
        }
    });
});

/*server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});*/

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
