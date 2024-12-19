import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export default function Bingo() {
    const [name, setName] = useState<string>("");
    const [room, setRoom] = useState<string>("");
    const [connected, setConnected] = useState<boolean>(false);
    const [users, setUsers] = useState<any[]>([]); // User states including Bingo cards and marked numbers

    const handleJoinRoom = () => {
        if (name && room) {
            socket = io("http://localhost:4000");

            // Emit joinRoom event
            socket.emit("joinRoom", { name, room });

            // Listen for user updates in the room
            socket.on("roomUpdate", (updatedUsers: string[]) => {
                setUsers(updatedUsers);
            });

            // Receive Bingo card
            socket.on("bingoCard", (card: number[][]) => {
                console.log("card", card);
            });

            // Update room state
            socket.on("updateRoomState", (roomState: any[]) => {
                setUsers(roomState);
            });

            setConnected(true);
        }
    };

    useEffect(() => {
        if (socket) {
          socket.on("updateRoomState", ({ roomState, winner }) => {
            setUsers(roomState);
            if (winner) {
              alert(`${winner} has won the game with exactly 5 bingos!`);
            }
          });
      
          socket.on("gameOver", ({ winner }) => {
            alert(`Game over! ${winner} is the winner!`);
          });
      
          return () => {
            if(socket){

                socket.off("updateRoomState");
                socket.off("gameOver");
            }
          };
        }
      }, [socket]); // Make sure 'socket' is updated as a dependency
      

    const handleMarkNumber = (number: number) => {
        if (socket) {
            socket.emit("markNumber", { number });
        }
    };

    const handleDisconnect = () => {
        if (socket) {
            socket.disconnect();
            setConnected(false);
            setUsers([]);
        }
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            {!connected ? (
                <div>
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
                    <button onClick={handleJoinRoom}>Join Room</button>
                </div>
            ) : (
                <div>
                    <h2>Welcome, {name}!</h2>
                    <p>You're connected to room: {room}</p>
                    <button onClick={handleDisconnect}>Disconnect</button>

                    <h3>Users in the room:</h3>
                    <ul>
                        {users.map((user, index) => (
                            <li key={index}>
                                {user.name}
                                <div>
                                    <strong>Total Bingos:</strong> {user.bingos}
                                </div>
                                {user.bingos === 5 && <strong>Winner!</strong>}
                            </li>
                        ))}
                    </ul>

                    <h3>Your Bingo Card:</h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 50px)",
                            gap: "5px",
                        }}
                    >
                        {users
                            .find((u) => u.name === name)
                            ?.card.flat()
                            .map((num: number, index: number) => (
                                <div
                                    key={index}
                                    onClick={() => handleMarkNumber(num)}
                                    style={{
                                        width: "50px",
                                        height: "50px",
                                        lineHeight: "50px",
                                        border: "1px solid #000",
                                        textAlign: "center",
                                        backgroundColor: users
                                            .find((u) => u.name === name)
                                            ?.marked.includes(num)
                                            ? "lightgreen"
                                            : "white",
                                        cursor: "pointer",
                                    }}
                                >
                                    {num}
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
