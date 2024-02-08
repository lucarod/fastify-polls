import z from 'zod';
import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';

export async function voteOnPoll(app: FastifyInstance) {
  app.post('/polls/:pollId/votes', async (request, reply) => {
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });

    try {
      const { pollOptionId } = voteOnPollBody.parse(request.body);
      const { pollId } = voteOnPollParams.parse(request.params);

      let { sessionId } = request.cookies;

      if (sessionId) {
        const userPreviousVoteOnPoll = await prisma.vote.findUnique({
          where: {
            sessionId_pollId: {
              sessionId,
              pollId,
            },
          },
        });

        if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId !== pollId) {
          await prisma.vote.delete({
            where: {
              id: userPreviousVoteOnPoll.id,
            },
          });
        } else if (userPreviousVoteOnPoll) {
          return reply
            .code(401)
            .send({ message: 'You already voted on this poll' });
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

      return reply.code(201).send({ id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply
          .code(409)
          .send(error.issues);
      }
    }
  });
}
