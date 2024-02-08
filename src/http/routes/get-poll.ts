import z from 'zod';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { getPollParams } from '../schemas/get-poll-schemas';

export async function getPoll(app: FastifyInstance) {
  app.get('/polls/:pollId', async (request, reply) => {
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
        return reply.code(409).send(error.issues);
      }
    }
  });
}
