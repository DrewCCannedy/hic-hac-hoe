const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const path = require('path')

class Game {
  constructor () {
    this.board = [
      null, null, null,
      null, null, null,
      null, null, null
    ]
    this.player1Turn = true
  }
}

let instance = new Game()
const port = process.env.PORT || 8080
const players = [null, null]

app.use(express.static(__dirname))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

io.on('connection', (socket) => {
  console.log(`Connecting ${socket.id}`)
  io.emit('update', instance.board, instance.player1Turn)
  let playerStatus = null
  if (players[0] == null) {
    players[0] = socket.id
    playerStatus = 'player1'
  } else if (players[1] == null) {
    players[1] = socket.id
    playerStatus = 'player2'
  } else {
    playerStatus = 'spectating'
  }
  io.to(`${socket.id}`).emit('player', `You are ${playerStatus}`)

  socket.on('disconnect', () => {
    console.log(`Disconnecting ${socket.id}`)

    const index = players.indexOf(socket.id)
    if (index > -1) {
      players[index] = null
    }
  })

  socket.on('update', (cell) => {
    console.log('Updating')
    if (instance.player1Turn && socket.id === players[0]) {
      instance.board[cell - 1] = 'h'
      instance.player1Turn = !instance.player1Turn
    } else if (!instance.player1Turn && socket.id === players[1]) {
      instance.board[cell - 1] = 'o'
      instance.player1Turn = !instance.player1Turn
    }
    io.emit('update', instance.board, instance.player1Turn)
  })

  socket.on('reset', () => {
    console.log('Resetting')
    instance = new Game()
    io.emit('update', instance.board, instance.player1Turn)
  })
})

http.listen(port, () => {
  console.log(`listening on port ${port}`)
})
