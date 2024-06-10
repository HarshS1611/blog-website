import { Hono } from "hono";
import { verify } from "hono/jwt";

import { getDBInstance } from "../utils";
import { getFormattedDate, shuffleArray } from "../utils";
import { buildQuery,buildPostSearchQuery,buildUserSearchQuery } from "../utils/queries";

import { createPostInput, updatePostInput } from "@harshs_16/zod-verifier";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string;
		JWT_SECRET: string;
	},
	Variables: {
		userId: string;
	}
}>();


blogRouter.get("/bulk/:id?", async (c) => {
	try {
		const userId = await c.req.param("id");
		let page = Math.max(parseInt(c.req.query("page") || `${DEFAULT_PAGE}`), 1);
		let pageSize = Math.max(parseInt(c.req.query("pageSize") || `${DEFAULT_PAGE_SIZE}`), 1);
		const prisma = getDBInstance(c);
		const query = buildQuery(userId);
		query.skip = (page - 1) * pageSize;
		query.take = pageSize;
		const posts = await prisma.post.findMany(query);
		const countQuery = buildQuery(userId);
		delete countQuery.skip;
		delete countQuery.take;
		const totalCount = await prisma.post.count({ where: countQuery.where });
		return c.json({
			posts: shuffleArray(posts),
			totalCount: totalCount,
			page: page,
			pageSize: pageSize,
			totalPages: Math.ceil(totalCount / pageSize),
		});
	} catch (e) {
		c.status(411);
		return c.json({
			message: "Error while fetching post",
			error: e
		});
	}
});
blogRouter.get("/search", async (c) => {
	try {
	  const keyword = c.req.query("keyword") || "";
	  const prisma = getDBInstance(c);
	  const postQuery = buildPostSearchQuery(keyword);
	  const userQuery = buildUserSearchQuery(keyword);
	  const [posts, users] = await Promise.all([
		prisma.post.findMany(postQuery),
		prisma.user.findMany(userQuery),
	  ]);
	  return c.json({
		posts: posts,
		users: users,
	  });
	} catch (e) {
	  c.status(411);
	  return c.json({
		message: "Error while fetching post",
		error: e,
	  });
	}
  });

blogRouter.get("/bulkUser/:id", async (c) => {
	try {
		const userId = await c.req.param("id");
		const prisma = getDBInstance(c);
		const posts = await prisma.post.findMany({
			where: {
				authorId: userId,
			},
			select: {
				content: true,
				title: true,
				id: true,
				publishedDateTime: true,
				imageUrl: true,
				author: {
					select: {
						name: true,
					},
				},
				upvotes: {
					select: {
						userId: true,
					},
				},
				comments: {
					select: {
						userId: true,
					},
				},
				published: true,

			},
		});
		return c.json({
			posts: posts,
		});
	} catch (e) {
		console.log(e);
		c.status(411);
		return c.json({
			message: "Error while fetching post",
		});
	}
});


blogRouter.use('/*', async (c, next) => {
	const jwt = c.req.header('Authorization');
	if (!jwt) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	const token = jwt.split(' ')[1];
	const payload = await verify(token, c.env.JWT_SECRET);
	if (!payload) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	c.set('userId', payload.id as string);
	await next()
})

blogRouter.get("/:id", async (c) => {
	try {
		const prisma = getDBInstance(c);
		const postId = await c.req.param("id");
		const userId = c.get("userId");
		const post = await prisma.post.findFirst({
			where: {
				id: postId,
			},
			select: {
				title: true,
				content: true,
				publishedDateTime: true,
				imageUrl: true,
				author: {
					select: {
						name: true,
						id: true,
						bio: true,
						profilePic: true,
						email: true
					},
				},
				id: true,
				bookmarks: {
					select: {
						id: true,
						user: {
							select: {
								id: true,
							},
						},
					},
				},
				upvotes: {
					select: {
						id: true
					}
				},
				comments: {
					select: {
						id: true
					}
				},


			},
		});

		const userBookmarkId = post?.bookmarks.find(
			(bookmark) => bookmark.user.id === userId
		);

		return c.json({
			post: {
				...post,
				bookmarkId: userBookmarkId?.id,
			},
		});
	} catch (e) {
		console.log(e);
		c.status(411);
		return c.json({
			message: "Error while fetching post",
		});
	}
});


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
			publishedDateTime: getFormattedDate(),
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
			where: {
				id: postId,
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