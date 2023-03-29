const express = require('express')
const multer = require('multer')
const sql = require('mssql')
const fs = require('fs')

const app = express()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

app.post('/file_upload', upload.single('file'), (req, res) => {
    // get the file name and buffer from the request
    const fileName = req.file.originalname
    const fileBuffer = req.file.buffer

    const config = {
        server: 'sql-file-server.database.windows.net',
        database: 'sqldb',
        user: 'azureuser@sql-file-server',
        password: 'asdf@1234',
        port: 1433,
        options: {
            encrypt: true
        }
    }

    const pool = new sql.ConnectionPool(config)

    pool.connect().then(() => {
        return pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'files')
        CREATE TABLE files (
            id INT IDENTITY(1,1) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            content VARBINARY(MAX) NOT NULL
        )
    `);
    }).then(() => {
        const request = new sql.Request(pool)
        request.input('name', sql.VarChar, fileName)
        request.input('content', sql.VarBinary, fileBuffer)
        return request.query('INSERT INTO files (name, content) VALUES (@name, @content)')
    }).then(result => {
        console.log('File uploaded and saved to the database')
        res.send('File uploaded and saved to the database')
    }).catch(err => {
        console.error(err)
        res.status(500).send('Error uploading file to the database')
    }).finally(() => {
        pool.close()
    })
})

app.listen(4000, () => {
    console.log('Server listening on port 4000')
})
