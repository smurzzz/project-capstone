import dotenv from 'dotenv';
import connectDb from './db/connect.js';
import { updateOrderStatus } from './controllers/orderController.js';

dotenv.config({ path: './.env' });
dotenv.config({ path: './.env.local', override: true });

const run = async () => {
  await connectDb();
  const req = {
    params: { id: '6a26dff945a24cf8072e125e' },
    body: { status: 'Confirmed' },
    user: { id: '6a25c365214b51c025d2025a', role: 'Admin', type: 'staff' }
  };
  const result = {};
  const res = {
    status(code) { result.status = code; return this; },
    json(payload) { result.body = payload; return this; }
  };
  try {
    await updateOrderStatus(req, res);
  } catch (err) {
    console.error('THROWN ERROR', err);
  }
  console.log('RESULT', JSON.stringify(result, null, 2));
};
run().catch((err) => { console.error(err); process.exit(1); });
