import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
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
        name: body.name,
        email: body.email,
        password: body.password
      }
    });
    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt });
  } catch (e) {
    c.status(403);
    return c.json({ error: "user already exists" });
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

userRouter.get('/me', async (c) => {
  const prisma = getDBInstance(c);
  const userId = c.get('userId');
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });
  if (!user) {
    c.status(403);
    return c.json({ error: "user not found" });
  }
  return c.json({
    id: user.id,
    name: user.name,
    details: user.bio,
    profilePic: user.profilePic,
    email: user.email
  });
}
);


userRouter.get("/profile/:id", async (c) => {
  const prisma = getDBInstance(c);
  const userId = await c.req.param("id");
  const authorizedUserId = c.get("userId");
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user) {
      c.status(400);
      return c.json({ error: "User does not exist" });
    }
    return c.json({
      user,
      isAuthorizedUser: authorizedUserId === userId,
      message: "Found user",
    });
  } catch (ex) {
    return c.status(403);
  }
});
userRouter.get("/", async (c) => {
  const prisma = getDBInstance(c);

  try {
    const users = await prisma.user.findMany();
    return c.json({
      payload: users,
      message: "All users",
    });
  } catch (ex) {
    return c.status(403);
  }
});

userRouter.post("/updateDetail", async (c) => {
  try {
    const prisma = getDBInstance(c);
    const userId = c.get("userId");
    const body = await c.req.json();
    const profileImage = body.imageUrl;
    const name = body.name;
    const bio = body.bio;

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: name,
        bio: bio,
        profilePic: profileImage,
      },
    });

    return c.json({
      id: user.id,
      name: user.name,
      details: user.bio,
      profilePic: user.profilePic,
      email: user.email
    });

  } catch (ex) {
    console.log(ex);
    c.status(403);
    return c.json({ error: "Something went wrong" });
  }
});