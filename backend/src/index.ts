import { Hono } from 'hono'
import { userRouter } from './routes/user';
import { blogRouter } from './routes/blog';
import { bookmarkRouter } from './routes/bookmark';
import { upvoteRouter } from './routes/upvote';
import { cors } from 'hono/cors'

export const app = new Hono<{
  Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
  }
}>();


app.use('/api/*', cors())
app.route('/api/v1/user', userRouter)
app.route('/api/v1/blog', blogRouter)
app.route('/api/v1/bookmark', bookmarkRouter)
app.route('/api/v1/upvote', upvoteRouter)

export default app