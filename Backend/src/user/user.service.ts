import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../core/database/database.constants';

@Injectable()
export class UserService {
  constructor(
    @Inject(PG_POOL)
    private readonly db: Pool,
  ) {}

  async testDatabaseConnection() {
    const result = await this.db.query('SELECT NOW() AS current_time');

    return {
      message: 'PostgreSQL connection is working',
      databaseTime: result.rows[0].current_time,
    };
  }
}