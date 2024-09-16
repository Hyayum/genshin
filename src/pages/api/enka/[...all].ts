import type { NextApiRequest, NextApiResponse } from "next";
import httpProxyMiddleware from "next-http-proxy-middleware";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const proxy = httpProxyMiddleware(req, res, {
    target: "https://enka.network/api",
    changeOrigin: true,
    pathRewrite: [
      {
        patternStr: "^/api/enka",
        replaceStr: "",
      }
    ],
  });
  return proxy;
}