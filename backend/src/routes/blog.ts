import { Hono } from "hono";
import { verify } from "hono/jwt";

import { getDBInstance } from "../utils";
import { getFormattedDate } from "../utils";

import { createPostInput, updatePostInput } from "@harshs_16/zod-verifier";
export const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string;
		JWT_SECRET: string;
	},
	Variables: {
		userId: string;
	}
}>();

blogRouter.get('/bulk/:id', async (c) => {
	const id = c.req.param('id');
	const prisma = getDBInstance(c);


	const post = await prisma.post.findUnique({
		where: {
			id
		}
	});

	return c.json(post);
})

blogRouter.get('/bulk', async (c) => {
	const prisma = getDBInstance(c);
	const posts = await prisma.post.findMany();
	console.log(posts);
	return c.json(posts);
});


blogRouter.use('/*', async (c, next) => {
	const jwt = c.req.header('Authorization');
	if (!jwt) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	const token = jwt.split(' ')[1];
	const payload = await verify(token, "test");
	if (!payload) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	c.set('userId', payload.id as string);
	await next()
})


blogRouter.post('/', async (c) => {
	const userId = c.get('userId');
	const prisma = getDBInstance(c);

	const body = await c.req.json();
	const { success } = createPostInput.safeParse(body);
	if (!success) {
		c.status(400);
		return c.json({ error: "invalid input" });
	}
	const post = await prisma.post.create({
		data: {
			title: body.title,
			content: body.content,
			imageUrl: body.imageUrl,
			authorId: userId,
			publishedDateTime : getFormattedDate(),
		}
	});
	return c.json({
		id: post.id
	});
})

blogRouter.put('/', async (c) => {
	const userId = c.get('userId');
	const prisma = getDBInstance(c);

	const body = await c.req.json();

	const { success } = updatePostInput.safeParse(body);
	if (!success) {
		c.status(400);
		return c.json({ error: "invalid input" });
	}
	try {
		const post = await prisma.post.update({
			where: {
				id: body.id,
				authorId: userId
			},
			data: {
				title: body.title,
				content: body.content,
				imageUrl: body.imageUrl,
			}
		});
		return c.json({
			id: post.id
		});
	} catch (e) {
		c.status(403);
		return c.json({ error: "error while updating post" });
	}
});


blogRouter.delete("/:id", async (c) => {
	try {
		const userId = c.get("userId");
		const prisma = getDBInstance(c);
		const postId = c.req.param("id");
		await prisma.post.delete({
			where: { id: postId,
				authorId: userId
			 }
		})

		return c.json({
			message: "Post deleted successfully",
		});
	} catch (e) {
		console.log(e);
		c.status(411);
		return c.json({
			message: "Error while deleting post",
		});
	}
});