import bcrypt from "bcryptjs";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateOTP = (length = 6): string => {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
};

export const sanitizeUser = (user: any) => {
  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.__v;
  return sanitized;
};

export const paginateQuery = (page?: number, limit?: number) => {
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.min(Math.max(1, limit || 10), 100);
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};
