import { PrismaClient } from "@/generated/prisma";

export const GET = async () => {
  try {
    const prisma = new PrismaClient();

    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return Response.json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};