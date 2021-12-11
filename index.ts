import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let clients: any[] = [];
const messages: any[] = [];
const PORT = 3000;

app.get('/status', (_request: any, response: any) =>
  response.json({ clients: clients.length })
);

app.get('/messages', (request: any, response: any) => {
  const headers: any = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache'
  };

  response.writeHead(200, headers);

  const data: string = `data: ${JSON.stringify(messages)}\n\n`;

  response.write(data);

  const clientId = (request.query.id ?? 'guest') + '_' + Date.now();

  const newClient: any = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter((client: any) => client.id !== clientId);
  });
});

app.post('/message', (request, response) => {
  if (
    request.query.id &&
    request.body &&
    request.body.message &&
    String(request.body.message).trim()
  ) {
    messages.push({
      user_id: request.query.id,
      message: request.body.message.trim()
    });
    notifyMessageToAllUsers(String(request.query.id));
    response.send({ status: 200, error: 'Message Sent Succesfully' });
  } else {
    response.send({ status: 400, error: 'Bad Request' });
  }
});

const notifyMessageToAllUsers = (userIdWithoutUnderscore: string) => {
  clients
    .filter(
      (client: any) =>
        String(client.id).split('_')[0] != userIdWithoutUnderscore
    )
    .forEach((client: any) => {
      client.response.write(`data: ${JSON.stringify(messages)}\n\n`);
    });
};

app.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
