import express from "express";
const router = express.Router();
import fs from 'fs';
import { decryptMedia } from '@open-wa/wa-decrypt';
import mime from 'mime-types';
import ffmpeg from 'fluent-ffmpeg'
import { exec } from 'child_process';




router.post("/process-media", async (req, res) => {
    const message = req.body;
    if (message.mimetype) {
        try {
            var filename = `public/uploads/${message.file_name}.${mime.extension(message.mimetype)}`;
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
                
                if(filename.endsWith('.oga')) {
                    
                    var newFilename = filename.replace('.oga', '.mp3');
                    exec(`ffmpeg -i ${filename} ${newFilename}`, async (error, stdout, stderr) =>  {
                        if (error) {
                            console.error('Error converting file:', error);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Error converting file',
                                data: {
                                    error: error,
                                },
                            });
                        }
                        // delete the old file
                        await fs.unlinkSync(filename);
                    });
                    
                filename = filename.replace('.oga', '.mp3');
                    
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