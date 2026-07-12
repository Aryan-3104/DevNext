// test-socket.js — run with: node test-socket.js
import { io as ioClient } from 'socket.io-client';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTRhZGFkOGM5MTI2NjJhMzMzMWU1ODUiLCJpYXQiOjE3ODM3OTk0MDUsImV4cCI6MTc4NDQwNDIwNX0.FeVdjCe78oFT09pcBtX3AUcz5AMFoVEpCB4b5vgf7j4';

const socket = ioClient('http://localhost:5000', {
    auth: { token: TOKEN },
});

socket.on('connect', () => {
    console.log('Connected! Socket ID:', socket.id);
});

socket.on('connect_error', (err) => {
    console.log('Connection failed:', err.message);
});

socket.on('notification:new', (notif) => {
    console.log('Received notification:', notif);
});