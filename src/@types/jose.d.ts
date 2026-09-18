import "jose";

declare module "jose" {
  interface JWTPayload {
    _id: string;
    isBusiness: boolean;
    isAdmin: boolean;
  }
}
