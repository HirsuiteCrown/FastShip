//here first we will build the code and the publish in S3

//we have our code in output so first we build the code.

const {exec} = require('child_process')
const path = require('path')
const fs = require('fs')
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3')
const mime = require('mime-types')

const s3Client = new S3Client({
    region: '',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const PROJECT_ID = process.env.PROJECT_ID;

async function init(){
    console.log("Executing script.js")
    const outDirPath = path.join(__dirname, 'output');

    const p = exec(`cd ${outDirPath} && npm install && npm run build`)

    //package install krte time jo bhi logs aayenge unko captur krte hai:-
    p.stdout.on('data', function(data){
        console.log(data.toString());
    })
    p.stderr.on('data', function(data){
        console.log('Error', data.toString());
    })    
    p.on('close',async function(){
        console.log('Build Complete')
        //after build we have to put dist file into S3
        const distFolderPath = path.join(__dirname,'output','dist')
        const distFolderContents = fs.readdirSync(distFolderPath,{recursive: true})

        //when we upload on S3 we have to give file path not folder.
        for(const file of distFolderContents){
            const filePath = path.join(distFolderPath,file);
            if(fs.lstatSync(filePath).isDirectory()) continue;
            //if folder then continue else upload on s3

            const command = new PutObjectCommand({
                Bucket: '',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            })

            await s3Client.send(command);
        }
        console.log('Done...')
    })
}