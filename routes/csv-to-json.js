const fs = require('fs');
const express = require('express');
const multer = require('multer');
const papaparse = require('papaparse');
const { json } = require('express');
const UPLOAD_PATH = 'data/csv-data';
const UPLOAD_PATH_JSON = 'data/json-data';
const upload = multer({
    dest: UPLOAD_PATH,
});
const router = new express.Router();
router.post('/upload', upload.single('file'), function (req, res) {
    const file = req.file;
    const original = file.originalname.split('.');
    const ext = original.pop();
    const newFileName = `${original.join('.')}-${(new Date).getTime()}`;
    const newFilePath = `${UPLOAD_PATH}/${newFileName}.${ext}`;
    fs.rename(file.path, newFilePath, function (err) {
        let message = "File upload successfully";
        let resp = {
            filename: file.originalname
        };
        if (err) {
            console.log(err);
            message = `${message} but failed to set the original name. File is stored as ${file.filename}`;
            resp.filename = file.filename;
        }
        fs.readFile(newFilePath, 'utf8', function (err, csvData) {
            if (err) {
                return res.status(500).json({
                    message: "Error reading uploaded file",
                });
            }
            const { data, meta, error } = papaparse.parse(csvData, {
                header: true
            });
            let result=[]
            for (let i = 0; i < data.length; i++) {
                let user = {
                    name: {
                        firstName: data[i].firstName,
                        lastName: data[i].lastName,
                    },
                    age: Number(data[i].age),
                    address: {
                        line1: data[i].line1,
                        line2: data[i].line2,
                    },
                    gender: data[i].gender
                };  
                result.push(user);
            }

            const dataWrite = JSON.stringify(result, null, 2);
            fs.writeFile(`${UPLOAD_PATH_JSON}/${newFileName}.json`, dataWrite, function (err) {
                if (err) {
                    return res.status(500).json({
                        message: "Error converting to json file",
                    });
                }
                res.json({
                    message: `${message} and converted into JSON`,
                    total: data.length,
                    res: data
                });
            });
        });
    });
})
module.exports = router;