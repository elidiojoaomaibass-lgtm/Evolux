// scratch/test_push.js
import handler from '../api/webhook';
import { createRequest, createResponse } from 'node-mocks-http';

(async () => {
  const req = createRequest({
    method: 'POST',
    body: {
      transaction_id: 'test-123',
      reference: 'ref-123',
      status: 'SUCCESSFUL',
    },
  });
  const res = createResponse({
    eventEmitter: require('events').EventEmitter,
  });

  await handler(req, res);
  console.log('Status:', res._getStatusCode());
  console.log('Body:', res._getData());
})();
