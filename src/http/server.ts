import fastify from 'fastify';

const app = fastify();

app.get('/hello', () => {
  return 'Hello NLW';
});

app.listen({ port: 3333 }).then(() => {
  console.log('🔥 server running at http://localhost:3333 !');
});
