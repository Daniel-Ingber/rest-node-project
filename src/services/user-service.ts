import { type User as UserRequest } from "../validations/user.ts";
import { UserModel } from "../database/models.ts";
import { HttpError, NotFoundError } from "../error/custom-error.ts";
import { type IUserDocument } from "../database/schemas/user.ts";
import authService from "./auth-service.ts";
import { logger } from "../middleware/logger.ts";

/** Bonus - a user that fails to login three times in a row
 * cannot login again for the next 24 hours
 * */
const MAX_FAILED_LOGIN_ATTEMPTS = 3;
const BLOCK_DURATION_IN_MS = 24 * 60 * 60 * 1000;

/** Counts the failed attempts of a user and blocks him on the third one */
const registerFailedLogin = async (user: IUserDocument) => {
  const failedAttempts = (user.failedLoginAttempts ?? 0) + 1;

  user.failedLoginAttempts = failedAttempts;
  if (failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    user.failedLoginAttempts = 0;
    user.blockedUntil = new Date(Date.now() + BLOCK_DURATION_IN_MS);
    logger.warn(`[registerFailedLogin]: Blocking the user ${user.email}`);
  }

  await user.save();
};

const userService = {
  createUser: async (userData: UserRequest) => {
    const userExist = await UserModel.findByEmail(userData.email);
    if (userExist) {
      logger.error("[createUser]: The email is aleardy taken");
      throw new HttpError("The email is aleardy taken", 400);
    }

    const user = new UserModel(userData);
    await user.setPassword(userData.password);

    const { password, ...userWithourPassword } = (await user.save()).toObject();
    logger.info("[createUser]: return success user without password");
    return userWithourPassword;
  },
  getUsers: async () => {
    const users = await UserModel.find({}, { password: 0 });
    logger.info("[getUsers]: Return all users");
    return users;
  },
  getUser: async (id: string) => {
    const user = await UserModel.findById(id);
    if (!user) {
      logger.error("[getUser]: No such user found");
      throw new NotFoundError("No such user found");
    }

    logger.info("[getUser]: Return user succesfully");
    return user;
  },
  updateUser: async (id: string, userData: Partial<UserRequest>) => {
    // The email is unique, so it cannot be taken from another user
    if (userData.email) {
      const userWithSameEmail = await UserModel.findByEmail(userData.email);

      if (userWithSameEmail && userWithSameEmail._id.toString() !== id) {
        logger.error("[updateUser]: The email is aleardy taken");
        throw new HttpError("The email is aleardy taken", 400);
      }
    }

    const user = await UserModel.findByIdAndUpdate({ _id: id }, userData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      logger.error("[updateUser]: No such user found");
      throw new NotFoundError("No such user found");
    }

    logger.info("[updateUser]: Update user succesfully - Return user");
    return user;
  },
  /** A user turns his own account into a business one and back */
  toggleBusinessStatus: async (id: string) => {
    const user = await userService.getUser(id);

    user.isBusiness = !user.isBusiness;

    const savedUser = await user.save();
    logger.info(`[toggleBusinessStatus]: isBusiness is now ${user.isBusiness}`);
    return savedUser;
  },
  deleteUser: async (id: string) => {
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      logger.error("[deleteUser]: No such user found");
      throw new NotFoundError("No such user found");
    }

    logger.info("[deleteUser]: Delete user succesfully - Return user");
    return user;
  },
  login: async (email: string, password: string) => {
    // Check if user exist
    // The password and the blocking fields are hidden by default,
    // so they are asked for explicitly
    const user = await UserModel.findOne({ email }).select(
      "+password +failedLoginAttempts +blockedUntil",
    );

    if (!user) {
      logger.error("[login]: Login Failed - cannot find user email");
      throw new HttpError("Login Failed - cannot find user email", 400);
    }

    if (user.blockedUntil && user.blockedUntil > new Date()) {
      logger.error("[login]: Login Failed - the user is blocked");
      throw new HttpError(
        `Login Failed - the user is blocked until ${user.blockedUntil.toISOString()}`,
        403,
      );
    }

    // Check if the password is correct
    // password - the password from the client
    // user.password - the encrypted password saved on the user in the DB
    const isPasswordValid = await authService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      await registerFailedLogin(user);

      logger.error("[login]: Login Failed - incorect password");
      throw new HttpError("Login Failed - incorect password", 400);
    }

    // A successfull login opens the account again
    user.failedLoginAttempts = 0;
    user.blockedUntil = null;
    await user.save();

    const token = authService.generateJWT({
      _id: user._id.toString(),
      isBusiness: user.isBusiness,
      isAdmin: user.isAdmin ?? false,
    });

    logger.info("[login]: Login succesfully - Return valid token for user");
    return token;
  },
};

export default userService;
