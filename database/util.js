import mongoose from "mongoose";
const { MONGO_URI, MONGO_DATABASE } = process.env;

export const openConnection = () => {
  mongoose.connect(`${MONGO_URI}/${MONGO_DATABASE}`);
};
export const closeConnection = () => {
  mongoose.connection.close();
};
