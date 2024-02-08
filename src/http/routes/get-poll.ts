import z from 'zod';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';

export async function getPoll(app: FastifyInstance) {
  app.get('/polls/:pollId', async (request, reply) => {
    const getPollParams = z.object({
      pollId: z.string().uuid(),
    });

    try {
      const { pollId } = getPollParams.parse(request.params);
      const poll = await prisma.poll.findUnique({
        where: {
          id: pollId,
        },
        include: {
          options: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return reply.send({ poll });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply
          .code(409)
          .send(error.issues);
      }
    }
  });
}
