export const handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Static Ping OK", node: process.version }),
  };
};
