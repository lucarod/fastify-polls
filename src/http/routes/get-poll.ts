import z from 'zod';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { getPollParams } from '../schemas/get-poll-schemas';
import { redis } from '../../lib/redis';

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

      if (!poll) {
        return reply.code(400).send({ message: 'Poll not found' });
      }

      const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES');

      const votes = result.reduce((accObject, current, index) => {
        if (index % 2 === 0) {
          const score = result[index + 1];

          Object.assign(accObject, { [current]: parseInt(score) });
        }

        return accObject;
      }, {} as Record<string, number>);

      return reply.send({
        poll: {
          ...poll,
          options: poll.options.map(option => ({
            ...option,
            score: (option.id in votes) ? votes[option.id]: 0,
          })),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(409).send(error.issues);
      }
    }
  });
}
