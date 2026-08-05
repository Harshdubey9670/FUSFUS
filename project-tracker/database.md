# Database Schema & Models

- **User**: Authentication details, profile, followers, following.
- **Post**: Images/Videos, captions, author, likes array, comments count.
- **Comment**: Text, author, parent post.
- **Story**: Ephemeral media, author, viewers array, expiresAt TTL index.
- **Reel**: Vertical video, music track, caption, author.
- **Conversation**: Participants array, latestMessage ref. Indexed on participants.
- **Message**: Text, media, sender, status (sent, delivered, seen). Indexed on conversation + createdAt.
- **Notification**: Type, sender, recipient, read status.