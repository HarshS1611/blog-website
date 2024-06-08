import { Hono } from "hono";
import { sign,verify } from "hono/jwt";
import { signinInput, signupInput } from "@harshs_16/zod-verifier"
import { getDBInstance } from "../utils";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  },
  Variables: {
    userId: string;
  }
}>();

userRouter.use("/me", async (c, next) => {
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
});

userRouter.post('/signup', async (c) => {
  const prisma = getDBInstance(c);
  const body = await c.req.json();
  const { success } = signupInput.safeParse(body);
  if (!success) {
    c.status(400);
    return c.json({ error: "invalid input" });
  }
  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password
      }
    });
    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt });
  } catch (e) {
    c.status(403);
    return c.json({ error: "error while signing up" });
  }
})

userRouter.post('/signin', async (c) => {
  const prisma = getDBInstance(c);

  const body = await c.req.json();
  const { success } = signinInput.safeParse(body);
  if (!success) {
    c.status(400);
    return c.json({ error: "invalid input" });
  }
  const user = await prisma.user.findUnique({
    where: {
      email: body.email
    }
  });

  if (!user) {
    c.status(403);
    return c.json({ error: "user not found" });
  }

  const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
  return c.json({ jwt });
})


