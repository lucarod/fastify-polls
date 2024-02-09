import { FastifyInstance } from 'fastify';

import { voting } from '../../utils/voting-pub-sub';
import { getPollParams } from '../schemas/get-poll-schemas';

export async function pollResults(app: FastifyInstance) {
  app.get('/polls/:pollId/results', { websocket: true }, (connection, request) => {
    const { pollId } = getPollParams.parse(request.params);
    voting.subscribe(pollId, (message) => {
      connection.socket.send(JSON.stringify(message));
    });
  });
}
