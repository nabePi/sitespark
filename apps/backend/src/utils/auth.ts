import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { UserPayload, Tokens } from '../types';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateTokens = (payload: UserPayload): Tokens => {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    { id: payload.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): UserPayload => {
  return jwt.verify(token, env.JWT_SECRET) as UserPayload;
};

export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
};

export const generateSubdomain = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 63);
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
};