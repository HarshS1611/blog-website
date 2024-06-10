import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { getDBInstance } from "../utils";
const MAX_upvoteS = 10;
export const upvoteRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string;
		JWT_SECRET: string;
	};
	Variables: {
		userId: string;
	};
}>();

upvoteRouter.use("/*", async (c, next) => {
	try {
		const header = c.req.header("Authorization") || "";
		const token = header && header.split(" ")[1];
		const user = await verify(token, c.env.JWT_SECRET);
		if (user && typeof user.id === "string") {
			c.set("userId", user.id);
			return next();
		} else {
			c.status(403);
			return c.json({ error: "Unauthorized " });
		}
	} catch (e) {
		c.status(403);
		return c.json({
			error: "Credentials failed",
		});
	}
});

upvoteRouter.get("/:postId", async (c) => {
	const prisma = getDBInstance(c);
	const userId = c.get("userId");
	const postId = await c.req.param("postId");
	try {
		if (userId) {
			const upvotes = await prisma.upvote.findMany({
				where: { userId: userId, postId: postId }
			});
			return c.json({
				upvotes: upvotes.length,
				message: "All posts bookmarked by user",
			});
		}
		c.status(403);
		return c.json({ error: "Invalid user Id" });
	} catch (ex) {
		return c.status(403);
	}
});

upvoteRouter.post("/", async (c) => {
	const prisma = getDBInstance(c);
	const body = await c.req.json();
	const userId = c.get("userId");
	const blogId = body.blogId;
	if (!userId || !blogId) {
		c.status(400);
		return c.json({
			message: "Inputs incorrect",
		});
	}

	try {
		const upvotes = await prisma.upvote.findMany({
			where: { userId: userId, postId: blogId }
		});
		if (upvotes.length < MAX_upvoteS) {
			const upvote = await prisma.upvote.create({
				data: {
					userId,
					postId: blogId,
				},
			});
			return c.json({
				id: upvote.id,
			});
		}
	} catch (ex) {
		console.log("ERROR ", ex);
		c.status(500);
		return c.json({ error: "Something went wrong " });
	}
});

upvoteRouter.delete("/", async (c) => {
	const prisma = getDBInstance(c);
	const body = await c.req.json();
	const userId = c.get("userId");
	const upvoteId = body.upvoteId;
	const postId = body.postId;

	if (!userId || !upvoteId) {
		c.status(400);
		return c.json({
			message: "Inputs incorrect",
		});
	}

	try {
		await prisma.upvote.delete({
			where: {
				id: upvoteId,
				postId: postId,
				userId: userId,
			},
		});
		return c.json({
			message: "Upvote deleted successfully",
		});
	} catch (ex) {
		console.log(ex);
		return c.status(403);
	}
});