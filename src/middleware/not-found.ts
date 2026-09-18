import { type RequestHandler } from "express";

// RequestHandler is the type of middleware function
const notFound: RequestHandler = (req, res, next) => {
  res.status(404).json({ error: "Page Not Found" });
};

export default notFound;
