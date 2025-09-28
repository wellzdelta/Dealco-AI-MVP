import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchModuleOptions, ElasticsearchOptionsFactory } from '@nestjs/elasticsearch';

@Injectable()
export class ElasticsearchConfig implements ElasticsearchOptionsFactory {
  constructor(private configService: ConfigService) {}

  createElasticsearchOptions(): ElasticsearchModuleOptions {
    const node = this.configService.get<string>('ELASTICSEARCH_NODE', 'http://localhost:9200');
    const username = this.configService.get<string>('ELASTICSEARCH_USERNAME');
    const password = this.configService.get<string>('ELASTICSEARCH_PASSWORD');

    const config: ElasticsearchModuleOptions = {
      node,
      maxRetries: 3,
      requestTimeout: 30000,
      pingTimeout: 3000,
      sniffOnStart: true,
      sniffOnConnectionFault: true,
      sniffInterval: 60000,
      resurrectStrategy: 'ping',
    };

    if (username && password) {
      config.auth = {
        username,
        password,
      };
    }

    return config;
  }
}