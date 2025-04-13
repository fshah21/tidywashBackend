import { https } from 'firebase-functions/v2';

// Create a simple HTTP function
export const helloWorld = https.onRequest((_request, response) => {
  response.send("Hello, world!");
});