import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { create } from 'ipfs-http-client';

@Injectable()
export class IpfsService {
  private ipfs;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('IPFS_PROJECT_ID');
    const projectSecret = this.configService.get<string>('IPFS_PROJECT_SECRET');
    const auth =
      'Basic ' +
      Buffer.from(projectId + ':' + projectSecret).toString('base64');

    this.ipfs = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
        authorization: auth,
      },
    });
  }

  async uploadFile(file: Buffer): Promise<string> {
    try {
      const result = await this.ipfs.add(file);
      return result.path;
    } catch (error) {
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  async getFile(hash: string): Promise<Buffer> {
    try {
      const stream = this.ipfs.cat(hash);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      throw new Error(`Failed to get file from IPFS: ${error.message}`);
    }
  }
}
