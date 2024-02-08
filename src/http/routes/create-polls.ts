import z from 'zod';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';

export async function createPoll(app: FastifyInstance) {
  app.post('/polls', async (request, reply) => {
    const createPollBody = z.object({
      title: z.string(),
      options: z.array(z.string()),
    });

    try {
      const { title, options } = createPollBody.parse(request.body);
      const poll = await prisma.poll.create({
        data: {
          title,
          options: {
            createMany: {
              data: options.map((option) => ({
                title: option,
              })),
            },
          },
        },
      });

      return reply
        .code(201)
        .send({ pollId: poll.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply
          .code(409)
          .send(error.issues);
      }
    }
  });
}
