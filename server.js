const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// رابط قاعدة البيانات الحقيقية الخاص بك
const MONGO_URI = "mongodb+srv://skyplz11_db_user:2v9M5XW96ABsSq0a@cluster0.jl0ycaq.mongodb.net/axisup?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ تم الاتصال بقاعدة البيانات الحقيقية بنجاح'))
  .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

const postSchema = new mongoose.Schema({
  userId: String,
  text: String,
  image: String,
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

const messageSchema = new mongoose.Schema({
  chatId: String,
  sender: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في جلب المنشورات' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const newPost = new Post({
      userId: req.body.userId,
      text: req.body.text,
      image: req.body.image || ''
    });
    await newPost.save();
    io.emit('new_post', newPost);
    res.json(newPost);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في حفظ المنشور' });
  }
});

io.on('connection', (socket) => {
  console.log('🔗 مستخدم متصل:', socket.id);

  socket.on('send_message', async (data) => {
    try {
      const msg = new Message({
        chatId: data.chatId,
        sender: data.sender,
        text: data.text
      });
      await msg.save();
      io.emit('receive_message', msg);
    } catch (e) {
      console.error('خطأ في حفظ الرسالة:', e);
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnect:', socket.id);
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر الحقيقي يعمل على المنفذ ${PORT}`);
});
