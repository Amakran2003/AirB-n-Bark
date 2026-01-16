export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const createHttpError = (status: number, message: string) => {
  return new HttpError(status, message);
};
