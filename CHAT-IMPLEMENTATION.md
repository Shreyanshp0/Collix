# **CHAT-IMPLEMENTATION.md** 

# **AI-Powered Collaborative Chat System (V1)** 

# **Objective** 

Build a secure, lightweight, scalable real-time group chat system using: 

- React 

- Node.js 

- Express 

- Socket.IO 

- MongoDB 

- JWT Authentication 

Every chat message should also be indexed asynchronously for the RAG pipeline without affecting chat latency. 

# **Architecture** 

```
                        React Frontend
                               │
                               │
                     HTTPS + Socket.IO
                               │
                               ▼
                  Express + Socket.IO Server
          ┌─────────────────────────────────────┐
          │                                     │
          │ JWT Authentication                  │
          │ Socket Authorization                │
          │ Group Membership Validation         │
          │ Message Persistence                 │
          │ Background AI Indexing              │
          │                                     │
          └─────────────────────────────────────┘
                    │                   │
                    ▼                   ▼
              MongoDB             Vector Database
                               (Background Indexing)
```

1 

Socket.IO is responsible only for: 

- Real-time communication 

- Presence 

- Typing • Notifications 

MongoDB is responsible for: 

- Permanent message storage 

The AI pipeline is completely asynchronous. 

# **Project Structure** 

```
backend/
src/
├── config/
│      socket.js
│      database.js
│
├── middleware/
│      auth.middleware.js
│
├── socket/
│      index.js
│      chat.socket.js
│
├── controllers/
│      group.controller.js
│      message.controller.js
│
├── routes/
│      group.routes.js
│      message.routes.js
│
├── models/
│      User.js
│      Group.js
│      Message.js
│
├── services/
│      chatIndexer.js
│
└── app.js
```

2 

# **Database Models** 

## **User** 

```
{
_id,
username,
email,
avatar,
passwordHash,
createdAt
}
```

## **Group** 

```
{
_id,
name,
description,
createdBy,
members:[
ObjectId
],
createdAt
}
```

## **Message** 

```
{
_id,
groupId,
senderId,
content,
```

3 

```
type:"user",
createdAt
}
```

Later versions may include: 

```
replyTo
editedAt
deleted
attachments
mentions
```

Not required for V1. 

# **Authentication Flow** 

```
User Login
      │
JWT Generated
      │
Client Stores Token
      │
Socket Connection
      │
JWT Verification
      │
Socket Authenticated
```

Every socket connection MUST verify JWT. 

4 

Never allow anonymous sockets. 

Example: 

```
io.use((socket,next)=>{
consttoken=socket.handshake.auth.token;
try{
socket.user=jwt.verify(
token,
process.env.JWT_SECRET
);
next();
}
catch{
next(newError("Unauthorized"));
}
});
```

# **Socket Connection Lifecycle** 

```
Connect
↓
Authenticate
↓
Join Group
↓
Receive Messages
↓
Send Messages
```

5 

```
↓
Disconnect
↓
Reconnect
↓
Authenticate Again
↓
Join Active Group Again
```

# **Socket Events** 

## **Client → Server** 

```
join-group
leave-group
send-message
typing-start
typing-stop
message-read
```

## **Server → Client** 

```
new-message
typing
message-read
user-online
user-offline
```

6 

```
system-message
error
```

Keep socket events minimal. 

# **Joining a Group** 

Client 

```
socket.emit(
    "join-group",
    groupId
);
```

Server 

```
Receive groupId
↓
Validate JWT
↓
Find Group
↓
Check Membership
↓
Join Socket Room
```

Example 

```
socket.on("join-group",async(groupId)=>{
constgroup=awaitGroup.findOne({
_id:groupId,
members:socket.user.id
```

7 

```
});
if(!group){
returnsocket.emit(
"error",
"Not a member"
);
}
socket.join(groupId);
});
```

Never trust the client. 

Membership MUST always be verified. 

# **Leaving a Group** 

```
socket.leave(groupId)
```

Remove from room only. 

Database membership changes happen through REST API. 

# **Sending Messages** 

Flow 

```
Client
↓
Socket Event
↓
Validate JWT
↓
Validate Membership
```

8 

```
↓
Validate Message
↓
Store MongoDB
↓
Broadcast Room
↓
Background AI Index
```

Example 

```
socket.on("send-message",async(data)=>{
constgroup=awaitGroup.findOne({
_id:data.groupId,
members:socket.user.id
});
if(!group){
return;
}
constmessage=awaitMessage.create({
groupId:data.groupId,
senderId:socket.user.id,
content:data.content
});
io.to(data.groupId)
.emit("new-message",message);
chatIndexer.embedAndStore(message);
```

9 

### `});` 

The AI indexing MUST NOT block chat delivery. 

# **Message Validation** 

Every message must satisfy: 

```
trim()
Not empty
Maximum length
Group exists
User belongs to group
```

Example 

```
Maximum length
2000 characters
```

# **Typing Indicator** 

Client 

```
typing-start
typing-stop
```

Server 

Broadcast to everyone except sender. 

No database storage. 

No message persistence. 

10 

# **Read Receipts** 

Client 

```
message-read
```

Store 

```
lastReadAt
```

Later compute unread counts. 

# **Presence** 

Socket connect 

↓ 

User online 

Socket disconnect 

↓ 

User offline 

Broadcast updates. 

No database writes are required for basic presence. 

# **System Messages** 

Examples 

```
Rahul joined the group
Shreyansh created the group
Aman left the group
```

Store them as normal messages. 

11 

Example 

```
{
type:"system",
content:"Rahul joined the group"
}
```

# **REST APIs** 

## **Groups** 

```
POST   /groups
GET    /groups
GET    /groups/:id
POST   /groups/:id/join
POST   /groups/:id/members
DELETE /groups/:id/leave
```

## **Messages** 

```
GET /groups/:id/messages
GET /groups/:id/messages?page=2
GET /groups/:id/messages?limit=30
```

Only fetching history uses REST. 

Everything real-time uses Socket.IO. 

# **Pagination** 

Never load full history. 

Example 

12 

```
Latest
30 messages
↓
User scrolls
↓
Load previous 30
↓
Repeat
```

# **Socket Rooms** 

Every group is one room. 

```
Group A
↓
Room A
Members
1
5
8
```

```
Group B
↓
Room B
Members
```

```
3
```

```
7
```

13 

```
10
```

Messages stay isolated. 

# **Security Checklist** 

## **JWT Authentication** 

Every socket connection. 

## **Membership Validation** 

Required on 

```
join-group
send-message
typing
message-read
```

Never assume previous validation. 

## **Input Validation** 

Reject 

```
Empty
Null
Very large
Invalid type
```

## **Rate Limiting** 

Example 

14 

```
20 messages
per
10 seconds
```

Prevent spam. 

## **HTTPS** 

Always deploy using 

```
HTTPS
```

Socket.IO automatically upgrades to 

```
WSS
```

Never deploy production using HTTP. 

# **Error Handling** 

Possible errors 

```
Unauthorized
Not Group Member
Group Not Found
Invalid Message
Server Error
```

Always return structured JSON. 

Example 

```
{
```

```
"success":false,
```

15 

```
"message":"Not a member"
}
```

# **AI Integration** 

Every successful message follows this pipeline. 

```
Message Saved
↓
Broadcast
↓
Background Queue
↓
Generate Embedding
↓
Store Vector
↓
Ready for RAG
```

The user should never wait for embeddings. 

# **Frontend Flow** 

```
Open Chat
↓
Fetch Previous Messages (REST)
↓
Display History
↓
```

16 

```
Connect Socket
↓
Authenticate
↓
Join Group
↓
Receive Live Messages
↓
Send Messages
↓
Disconnect
↓
Reconnect
↓
Join Group Again
```

# **Features Included in V1** 

JWT Authentication 

Socket.IO Authentication 

Group Rooms 

Real-time Messaging 

MongoDB Persistence 

Message History 

Pagination 

17 

Typing Indicators 

Online Presence 

Read Receipts 

System Messages 

Background AI Indexing 

- Secure Membership Validation 

Reconnection Handling 

# **Not Included in V1** 

- Video Calls 

- Voice Calls 

- Screen Sharing 

- Message Reactions 

- Threads 

- File Attachments 

- Rich Text Editor 

- Polls 

- Voice Messages 

- End-to-End Encryption 

These features can be implemented in later versions without changing the chat architecture. 

# **Development Order** 

## **Phase 1** 

- User authentication (JWT) 

- Group CRUD APIs 

- MongoDB models 

## **Phase 2** 

- Integrate Socket.IO 

- Secure socket authentication 

- Implement group rooms 

- Join/leave room events 

18 

## **Phase 3** 

- Send and receive messages 

- Persist messages to MongoDB 

- Broadcast messages 

## **Phase 4** 

- Message history API 

- Pagination 

- Infinite scroll 

## **Phase 5** 

- Typing indicators 

- Online/offline presence 

- Read receipts 

- System messages 

## **Phase 6** 

- Integrate asynchronous embedding pipeline 

- Store vectors in the vector database 

- Connect RAG retrieval 

# **Guiding Principles** 

1. Never trust client data. 

2. Authenticate every socket connection. 

3. Validate group membership for every sensitive socket event. 

4. Store messages before broadcasting. 

5. Never block chat delivery for AI processing. 

6. Keep Socket.IO events minimal. 

7. Use REST for history and Socket.IO for live communication. 

8. Design chat independently so WebRTC can be added later without modifying the messaging system. 

19 

