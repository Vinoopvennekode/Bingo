import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export default function Bingo() {
    const [card, setCard] = useState<(number | string)[][]>([]);
    const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
    const [bingo, setBingo] = useState(false);
    const [inputNumber, setInputNumber] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [room, setRoom] = useState<string>("");
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    console.log('socket', socket);

    useEffect(() => {
        // Listen for card generation
        socket.on("cardGenerated", (newCard) => {
            setCard(newCard);
        });

        // Listen for drawn numbers
        socket.on("numberDrawn", (number) => {
            setDrawnNumbers((prev) => [...prev, number]);
            markNumber(number);
        });

        // Listen for room updates
        socket.on("roomUpdate", (updatedUsers) => {
            setUsers(updatedUsers);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Join room
    function joinRoom() {
        if (name && room) {
            socket.emit("joinRoom", { name, room });
        }
    }

    // Mark a number on the card
    function markNumber(number: number) {
        const updatedCard = card.map((row) =>
            row.map((cell) => (cell === number ? "X" : cell))
        );
        setCard(updatedCard);

        if (checkBingo(updatedCard)) {
            setBingo(true);
        }
    }

    // Check for Bingo
    function checkBingo(card: (number | string)[][]): boolean {
        for (let row = 0; row < 5; row++) {
            if (card[row].every((cell) => cell === "X")) return true;
        }
        for (let col = 0; col < 5; col++) {
            if (card.every((row) => row[col] === "X")) return true;
        }
        const diagonal1 = card.every((row, i) => row[i] === "X");
        const diagonal2 = card.every((row, i) => row[4 - i] === "X");
        return diagonal1 || diagonal2;
    }

    // Handle input submit for marking a number
    function handleInputSubmit() {
        const number = parseInt(inputNumber, 10);
        if (!isNaN(number)) {
            markNumber(number);
            socket.emit("markNumber", { room, number }); // Notify the server
        }
        setInputNumber(""); // Clear the input field
    }

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            {/* <h1>Bingo Game</h1> */}

            <div style={{ marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ marginRight: "10px" }}
                />
                <input
                    type="text"
                    placeholder="Enter room name"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    style={{ marginRight: "10px" }}
                />
                <button onClick={joinRoom}>Join Room</button>
            </div>

            {bingo && <h2 style={{ color: "green" }}>🎉 BINGO! 🎉</h2>}

            <div>
                <h3>Users in Room:</h3>
                {users.map((user) => (
                    <div key={user.id}>{user.name}</div>
                ))}
            </div>

            <div style={{ marginTop: "20px" }}>
                <input
                    type="text"
                    value={inputNumber}
                    onChange={(e) => setInputNumber(e.target.value)}
                    placeholder="Enter number to mark"
                    style={{
                        padding: "5px",
                        marginRight: "10px",
                        fontSize: "16px",
                        width: "200px",
                    }}
                />
                <button onClick={handleInputSubmit}>Mark Number</button>
            </div>

            <div style={{ marginTop: "20px" }}>
                {card.map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: "flex", justifyContent: "center" }}>
                        {row.map((cell, colIndex) => (
                            <div
                                key={colIndex}
                                style={{
                                    width: "50px",
                                    height: "50px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    border: "1px solid black",
                                    margin: "2px",
                                    backgroundColor: cell === "X" ? "#d1f7c4" : "white",
                                }}
                            >
                                {cell}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: "20px" }}>
                <h3>Drawn Numbers:</h3>
                {drawnNumbers.join(", ")}
            </div>
        </div>
    );
}
