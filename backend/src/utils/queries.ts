import { Prisma } from "@prisma/client";
interface PostQueryBase {
	select: {
		content?: boolean;
		title?: boolean;
		id?: boolean;
		publishedDateTime?: boolean;
		author?: { select: { name: boolean, email?: boolean, bio?: boolean, profilePic?: boolean } };
		published?: boolean;
	};
	orderBy?: Prisma.Enumerable<Prisma.PostOrderByWithRelationInput>;
}

interface UserQueryBase {
	select: {
		name: boolean;
		id: boolean;
		email: boolean;
	};
	where?: any;
	skip?: number;
	take?: number;
	orderBy?: Prisma.Enumerable<Prisma.PostOrderByWithRelationInput>;
}

interface PostQueryWithWhere extends PostQueryBase {
	where?: { authorId?: string; };
	skip?: number;
	take?: number;
}

interface SearchQueryWithWhere extends PostQueryBase {
	where?: any;
	skip?: number;
	take?: number;
}

export const buildQuery = (
	userId: string | undefined,
): PostQueryWithWhere => {
	let baseQuery: PostQueryWithWhere = {
		select: {
			content: true,
			title: true,
			id: true,
			publishedDateTime: true,
			author: { select: { name: true, bio: true, profilePic: true, email: true } },
			published: true,
		},
		orderBy: [
			{
				upvotes: {
					_count: "desc",
				},
			},

			{
				publishedDateTime: "asc",
			},
		],
	};

	baseQuery = { ...baseQuery, where: { ...baseQuery.where, authorId: userId } };


	return baseQuery;
};

export const buildPostSearchQuery = (keyword: string): SearchQueryWithWhere => {
	let baseQuery: SearchQueryWithWhere = {
		select: {
			title: true,
			id: true,
			publishedDateTime: true,
			author: { select: { name: true, bio: true, profilePic: true, email: true } },
		},
		orderBy: [
			{
				upvotes: {
					_count: "desc",
				},
			},

			{
				publishedDateTime: "desc",
			},
		],
		where: {
			OR: [
				{
					title: {
						contains: keyword,
						mode: "insensitive",
					},
				},
				{
					content: {
						contains: keyword,
						mode: "insensitive",
					},
				},
				{
					author: {
						name: {
							contains: keyword,
							mode: "insensitive",
						},
					},
				},
			],
		},
		skip: 0,
		take: 5,
	};

	return baseQuery;
};

export const buildUserSearchQuery = (keyword: string): UserQueryBase => {
	let baseQuery: UserQueryBase = {
		select: {
			id: true,
			name: true,
			email: true,
		},
		where: {
			name: {
				contains: keyword,
				mode: "insensitive",
			},
		},
		skip: 0,
		take: 5,
	};

	return baseQuery;
};

