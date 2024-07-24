const socket = io();

const chess = new Chess();

const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark');
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;
            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;
                pieceElement.addEventListener('dragstart', (event) => {
                    console.log(`Drag started for piece at ${rowIndex},${squareIndex}`);
                    draggedPiece = pieceElement;
                    sourceSquare = { row: rowIndex, col: squareIndex };
                    event.dataTransfer.setData("text/plain", ""); // Required for Firefox
                });
                pieceElement.addEventListener("dragend", () => {
                    console.log(`Drag ended for piece at ${sourceSquare.row},${sourceSquare.col}`);
                    draggedPiece = null;
                    sourceSquare = null;
                });
                squareElement.appendChild(pieceElement);
            }
            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                console.log(`Dropped at ${squareElement.dataset.row},${squareElement.dataset.col}`);
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMoves(sourceSquare, targetSquare);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });
}

const handleMoves = (source, target) => {
    console.log(`Handling move from ${source.row},${source.col} to ${target.row},${target.col}`);
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };
    if (chess.move(move)) {
        socket.emit('move', move);
        renderBoard();
    } else {
        console.log(`Invalid move from ${move.from} to ${move.to}`);
        renderBoard();
    }
}

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: '♙',
        r: '♖',
        n: '♘',
        b: '♗',
        q: '♕',
        k: '♔',
        P: '♟',
        R: '♜',
        N: '♞',
        B: '♝',
        Q: '♛',
        K: '♚',
    };
    return unicodePieces[piece.type] || "";
}

socket.on('playerRole', (role) => {
    playerRole = role;
    console.log(`Player role set to: ${role}`);
    renderBoard();
});

socket.on('spectators', () => {
    playerRole = null;
    console.log('Spectator mode');
    renderBoard();
});

socket.on("boardState", (fen) => {
    console.log(`Board state updated: ${fen}`);
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    console.log(`Move received: ${JSON.stringify(move)}`);
    chess.move(move);
    renderBoard();
});

renderBoard();
