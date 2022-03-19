import { Client } from "@elastic/elasticsearch";
const { ELASTIC_USERNAME, ELASTIC_PASSWORD, ELASTIC_URI } = process.env;

export const client = new Client({
  node: ELASTIC_URI,
  // this is for local only
  tls: { rejectUnauthorized: false },
  auth: {
    username: ELASTIC_USERNAME,
    password: ELASTIC_PASSWORD,
  },
});


