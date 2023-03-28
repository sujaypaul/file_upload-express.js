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
        server: '<your_server_name>.database.windows.net',
        database: '<your_database_name>',
        user: '<your_username>@<your_server_name>',
        password: '<your_password>',
        port: 1433,
        options: {
            encrypt: true
        }
    }

    const pool = new sql.ConnectionPool(config)

    pool.connect().then(() => {
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
