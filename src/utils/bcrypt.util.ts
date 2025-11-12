import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export class BcryptUtil {
  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}