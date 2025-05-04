//here first we will build the code and the publish in S3

//we have our code in output so first we build the code.

//logs ko store krne ke liye kafka
//all container will throw their logs to kafka
//kafka consumer will consume all the logs and we put these logs in clickhouse
//fast data me postgress thoda slow perform krte hai thats why clickHouse

const {exec} = require('child_process')
const path = require('path')
const fs = require('fs')
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3')
const mime = require('mime-types')
const {Kafka} = require('kafkajs')


const s3Client = new S3Client({
    region: '',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const PROJECT_ID = process.env.PROJECT_ID;
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;

const kafka = new Kafka({
    clientId: `docker-build-server-${DEPLOYMENT_ID}`,
    brokers: [''],
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname,'kafka.pem'), 'utf-8')]
    },
    sasl: {
        username: 'avnadmin',
        password: '',
        mechanism: 'plain'
    }
})

const producer = kafka.producer()

//hume ye topic kafka ke andar banan hoga
//so in kafka(aiven) go to Topics and creat topics
async function publishLog(log){
    await producer.send({
        topic: `container-logs`,
        messages: [{
            key: 'log',
            value: JSON.stringify({PROJECT_ID,DEPLOYMENT_ID,log })
        }]
    })
}


async function init(){

    await producer.connect();

    console.log("Executing script.js")
    await publishLog('Build Started...')
    const outDirPath = path.join(__dirname, 'output');

    const p = exec(`cd ${outDirPath} && npm install && npm run build`)

    //package install krte time jo bhi logs aayenge unko captur krte hai:-
    p.stdout.on('data',async function(data){
        console.log(data.toString());
        await publishLog(data.toString());
    })
    p.stderr.on('data',async function(data){
        console.log('Error', data.toString());
        await publishLog(`error: ${data.toString()}`);
    })    
    p.on('close',async function(){
        console.log('Build Complete')
        await publishLog('Build Complete');
        //after build we have to put dist file into S3
        const distFolderPath = path.join(__dirname,'output','dist')
        const distFolderContents = fs.readdirSync(distFolderPath,{recursive: true})

        //when we upload on S3 we have to give file path not folder.
        await publishLog('Starting to upload');
        for(const file of distFolderContents){
            publishLog(`uploading file ${file}`);
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
            await publishLog(`uploaded ${file}`);
            console.log('uploaded', filePath);
        }
        await publishLog('Done');
        console.log('Done...');
        process.exit(0);
    })
}
init()