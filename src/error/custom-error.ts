export class HttpError extends Error {
  /**
   *
   */
  constructor(
    message: string = "Internal Server Error",
    statusCode: number = 500,
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }

  statusCode: number;
}

export class NotFoundError extends HttpError {
  /**
   *
   */
  constructor(message: string = "Not Found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}
