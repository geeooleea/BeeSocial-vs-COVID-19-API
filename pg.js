require('dotenv').config();
const { Client } = require('pg');

class PG {

    constructor() {
        if (process.env.SSL) {
            this.client = new Client({
                connectionString: process.env.DATABASE_URL
            });
        } else {
            this.client = new Client({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
        }
        
        this.client.connect();
    }

    async getActivities(callback) {
        await this.client.query('SELECT * FROM activities', (error, results) => {
            if (error) throw error;
            return callback(results);
        });
    }

    async findOrCreateUser(user, callback) {
        await this.client.query('SELECT * FROM users WHERE email=\''+user.email+'\'', async (error, results) => {
            if (error) throw error;
            var val;
            if (results.rowCount === 0) { // USER DOES NOT EXIST
                var user_str = '(\''+user.given_name+'\',\''+user.family_name+'\',\''+user.email+'\',\''+user.picture+'\')';
                console.log(user_str)
                await this.client.query('INSERT INTO users(name,last_name,email,image) VALUES '+user_str, (error, results) => {
                    if (error) throw error;
                    console.log(results);
                    callback(error, results.rows[0]);
                });
            } else {
                callback(error, results.rows[0]);
            }
        });
    }
}

module.exports = PG;