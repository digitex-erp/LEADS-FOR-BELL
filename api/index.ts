import appPromise from "../server";

export default async function handler(req, res) {
  const app = await appPromise;
  return app(req, res);
}
