import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { IHashManager } from '@/interfaces/IHashManager';

dotenv.config();

export class HashManager implements IHashManager {
  public hash = async (plaintext: string): Promise<string> => {
    const salt = await bcrypt.genSalt(14);
    const hash = await bcrypt.hash(plaintext, salt);

    return hash;
  };

  public compare = async (
    plaintext: string,
    hash: string,
  ): Promise<boolean> => {
    return bcrypt.compare(plaintext, hash);
  };
}
