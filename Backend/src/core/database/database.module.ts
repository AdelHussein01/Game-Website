import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { PG_POOL } from './database.constants';

@Module({
  providers: [...databaseProviders],
  exports: [PG_POOL],
})
export class DatabaseModule {}