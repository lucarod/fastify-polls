import z from 'zod';
import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { voteOnPollBody, voteOnPollParams } from '../schemas/vote-on-poll-schemas';

export async function voteOnPoll(app: FastifyInstance) {
  app.post('/polls/:pollId/votes', async (request, reply) => {
    try {
      const { pollOptionId } = voteOnPollBody.parse(request.body);
      const { pollId } = voteOnPollParams.parse(request.params);

      let { sessionId } = request.cookies;

      if (sessionId) {
        const userPreviousVote = await prisma.vote.findUnique({
          where: {
            sessionId_pollId: {
              sessionId,
              pollId,
            },
          },
        });

        if (userPreviousVote) {
          if (userPreviousVote.pollOptionId === pollOptionId) {
            return reply.code(401).send({ message: 'You already voted on this poll' });
          }

          await prisma.vote.delete({ where: { id: userPreviousVote.id } });

          await redis.zincrby(pollId, -1, userPreviousVote.pollOptionId);
        }
      }

      if (!sessionId) {
        sessionId = randomUUID();

        reply.setCookie('sessionId', sessionId, {
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          signed: true,
          httpOnly: true,
        });
      }

      const { id } = await prisma.vote.create({
        data: {
          sessionId,
          pollId,
          pollOptionId,
        },
      });

      await redis.zincrby(pollId, 1, pollOptionId);

      return reply.code(201).send({ id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(409).send(error.issues);
      }

      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });
}
