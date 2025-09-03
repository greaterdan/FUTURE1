import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseConnection {
    private pool: Pool;
    private static instance: DatabaseConnection;

    private constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'solana_tokens',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public async getClient(): Promise<PoolClient> {
        return await this.pool.connect();
    }

    public async query(text: string, params?: any[]): Promise<any> {
        const client = await this.getClient();
        try {
            const result = await client.query(text, params);
            return result;
        } finally {
            client.release();
        }
    }

    public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    public async close(): Promise<void> {
        await this.pool.end();
    }

    public async testConnection(): Promise<boolean> {
        try {
            const result = await this.query('SELECT NOW()');
            console.log('Database connection successful:', result.rows[0]);
            return true;
        } catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }

    public async ensureSchema(): Promise<void> {
        try {
            console.log('Ensuring database schema...');
            
            await this.transaction(async (client) => {
                // Add missing columns if they don't exist
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS name VARCHAR(255);
                `);
                
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS symbol VARCHAR(50);
                `);
                
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS creator VARCHAR(255);
                `);
                
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'pump';
                `);
                
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS launch_time TIMESTAMP;
                `);
                
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS decimals INT NOT NULL DEFAULT 0;
                `);
                
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS supply BIGINT NOT NULL DEFAULT 0;
                `);
                
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS blocktime TIMESTAMPTZ;
                `);
                
                // Update status values to match the database constraints
                await client.query(`
                    ALTER TABLE tokens ALTER COLUMN status TYPE VARCHAR(50);
                `);
                
                // Fix status constraint to allow 'fresh' and 'active' only
                // First, backfill any legacy statuses into allowed set BEFORE creating constraint
                await client.query(`
                    UPDATE tokens SET status='fresh'
                    WHERE status NOT IN ('fresh','active') OR status IS NULL;
                `);
                
                // Drop old check constraint if it exists
                await client.query(`
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM pg_constraint c
                            JOIN pg_class t ON t.oid = c.conrelid
                            WHERE t.relname = 'tokens' AND c.conname = 'tokens_status_check'
                        ) THEN
                            EXECUTE 'ALTER TABLE tokens DROP CONSTRAINT tokens_status_check';
                        END IF;
                    END $$;
                `);
                
                // Set default status to 'fresh' and make it NOT NULL
                await client.query(`
                    ALTER TABLE tokens
                    ALTER COLUMN status SET DEFAULT 'fresh',
                    ALTER COLUMN status SET NOT NULL;
                `);
                
                // Now create the check constraint with allowed values ONLY
                await client.query(`
                    ALTER TABLE tokens
                    ADD CONSTRAINT tokens_status_check
                    CHECK (status IN ('fresh','active'));
                `);
                
                // Create indexes if they don't exist
                await client.query(`
                    CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
                `);
                
                await client.query(`
                    CREATE INDEX IF NOT EXISTS idx_tokens_blocktime ON tokens(blocktime DESC NULLS LAST);
                `);
                
                await client.query(`
                    CREATE INDEX IF NOT EXISTS idx_tokens_contract_address ON tokens(contract_address);
                `);
                
                await client.query(`
                    CREATE INDEX IF NOT EXISTS idx_tokens_source ON tokens(source);
                `);

                // Make name and symbol nullable for fresh mints without metadata
                await client.query(`
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name='tokens' AND column_name='name' AND is_nullable='NO'
                        ) THEN
                            EXECUTE 'ALTER TABLE tokens ALTER COLUMN name DROP NOT NULL';
                        END IF;

                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name='tokens' AND column_name='symbol' AND is_nullable='NO'
                        ) THEN
                            EXECUTE 'ALTER TABLE tokens ALTER COLUMN symbol DROP NOT NULL';
                        END IF;
                    END $$;
                `);
                
                // Update source check constraint to allow 'helius'
                await client.query(`
                    ALTER TABLE tokens DROP CONSTRAINT IF EXISTS tokens_source_check;
                    ALTER TABLE tokens ADD CONSTRAINT tokens_source_check 
                    CHECK (source IN ('pump', 'meteora', 'helius'));
                `);
                
                // Add new columns for metadata and bonding curve
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS metadata_uri TEXT;
                `);
                
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS image_url TEXT;
                `);
                
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS bonding_curve_address TEXT;
                `);
                
                await client.query(`
                    ALTER TABLE tokens ADD COLUMN IF NOT EXISTS is_on_curve BOOLEAN DEFAULT FALSE;
                `);
                
                // Update status constraint to allow 'curve' status
                await client.query(`
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM pg_constraint c
                            JOIN pg_class t ON t.oid = c.conrelid
                            WHERE t.relname = 'tokens' AND c.conname = 'tokens_status_check'
                        ) THEN
                            EXECUTE 'ALTER TABLE tokens DROP CONSTRAINT tokens_status_check';
                        END IF;
                    END $$;
                `);
                
                await client.query(`
                    ALTER TABLE tokens
                    ADD CONSTRAINT tokens_status_check
                    CHECK (status IN ('fresh','active','curve'));
                `);
            });
            
            console.log('Database schema ensured successfully');
        } catch (error) {
            console.error('Error ensuring database schema:', error);
            throw error;
        }
    }
}

export default DatabaseConnection.getInstance();
