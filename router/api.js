import express from "express";
const router = express.Router();
import fs from 'fs';
import { decryptMedia } from '@open-wa/wa-decrypt';
import mime from 'mime-types';
import ffmpeg from 'fluent-ffmpeg'
import { exec } from 'child_process';
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/dw')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage });

const videoToAudio = async (data, start, end) => {
    const filePath = path.resolve(BASE_DIR, uuidv4())

    const input = `${filePath}.mp4`
    const output = `${filePath}.mp3`

    fs.writeFileSync(input, data)
    return await exec(input, output, start, end)
}

router.post('/convert-wa-oga', async (req, res) => {
    try {
        console.log('Request:', req.body);
        const file = req.body.audio;
        
        upload.single('audio')(req, res, async (err) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error uploading file',
                    data: {
                        error: err,
                    },
                });
            }
            console.log('File uploaded:', req.file);

            var filename = `public/dw/${req.file.originalname}`;
            var newFilename = `public/dw/${req.file.filename}.oga`;
            // audioCodec = 'libopus'
            exec(`ffmpeg -i ${filename} -metadata vendor="WhatsApp" -c:a libopus ${newFilename}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
            });
            
            ffmpeg.ffprobe(newFilename, (err, metadata) => {
                if (err) {
                    console.error('Error while parsing metadata:', err);
                    return;
                }
            
                // Print all metadata
                console.log('Metadata:', metadata);
            
                // Extract specific metadata fields
                const format = metadata.format;
                console.log('Duration:', format.duration); // Duration of the video
                console.log('Format:', format.format_long_name); // Format of the video
                console.log('Bit rate:', format.bit_rate); // Bit rate of the video
            });

            var url = 'https://wa-decrypt.ospo.in/' + newFilename.replace('public/', '');

            res.status(200).json({
                status: 'success',
                message: 'File saved successfully',
                data: {
                    url: url,
                },
            });
        });
        

    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error processing message',
            data: {
                error: error,
            },
        });
    }

}
);

router.post('/media-downloader', async (req, res) => {
    try {
        console.log('Request:', req.body);
        const file = req.body.audio;
        
        upload.single('audio')(req, res, async (err) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error uploading file',
                    data: {
                        error: err,
                    },
                });
            }
            console.log('File uploaded:', req.file);
            
            const ext = req.ext ?? 'mp3';
            

            var filename = `public/dw/${req.file.originalname}`;
            var newFilename = `public/dw/${req.file.originalname}.${ext}`;
            // two channels
            exec(`ffmpeg -i ${filename} -metadata vendor="WhatsApp" -c:a  ${newFilename}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
            });

            var url = 'https://wa-decrypt.ospo.in/' + newFilename.replace('public/', '');

            res.status(200).json({
                status: 'success',
                message: 'File saved successfully',
                data: {
                    url: url,
                },
            });
        });
        

    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error processing message',
            data: {
                error: error,
            },
        });
    }


}
);

router.post("/process-media", async (req, res) => {
    const message = req.body;
    if (message.mimetype) {
        try {
            var filename = `public/fs/${message.file_name}.${mime.extension(message.mimetype)}`;
            const mediaData = await decryptMedia(message);

            fs.writeFile(filename, mediaData, (err) => {
                if (err) {
                    console.error('Error saving file:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Error saving file',
                        data: {
                            error: err,
                        },
                    });
                }
                console.log('The file was saved!');

                if (filename.endsWith('.oga')) {
                    var newFilename = `public/fs/${message.file_name}.mp3`;
                    exec(`ffmpeg -i ${filename} ${newFilename}`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`exec error: ${error}`);
                            return;
                        }
                        console.log(`stdout: ${stdout}`);
                        console.error(`stderr: ${stderr}`);
                    });
                    filename = newFilename;
                }

                var url = 'https://wa-decrypt.ospo.in/' + filename.replace('public/', '');

                res.status(200).json({
                    status: 'success',
                    message: 'File saved successfully',
                    data: {
                        url: url,
                    },
                });
            });
        } catch (error) {
            console.error('Error processing message:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error processing message',
                data: {
                    error: error,
                },
            });
        }
    } else {
        res.status(400).json({
            status: 'error',
            message: 'Invalid message',
            data: {},
        });
    }
}
);



export default router;