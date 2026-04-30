import path from 'node:path';
import { env } from '@/config/env';

export const resolveUploadDir = () => {
  const repoRoot = path.basename(process.cwd()) === 'server' ? path.resolve(process.cwd(), '..') : process.cwd();
  return path.resolve(repoRoot, env.UPLOAD_DIR);
};
