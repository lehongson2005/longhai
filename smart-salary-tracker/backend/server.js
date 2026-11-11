require('dotenv').config({ quiet: true });
const app = require('./src/app');
const { ready } = require('./src/database/db');

const PORT = process.env.PORT || 5000;

ready()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
