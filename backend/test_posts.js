const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/crypto-app')
  .then(async () => {
    const Post = mongoose.model('Post', new mongoose.Schema({
      creator: mongoose.Schema.Types.ObjectId,
      isPublished: Boolean,
      status: String,
      language: String,
      media: Object
    }, { strict: false }));
    const posts = await Post.find({});
    console.log(posts.map(p => ({id: p._id, creator: p.creator, isPublished: p.isPublished, status: p.status})));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
