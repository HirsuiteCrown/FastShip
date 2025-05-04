const express = require('express')
const {generateSlug} = require('random-word-slugs')
const {ECSClient, RunTaskCommand} = require('@aws-sdk/client-ecs')
const cors = require('cors')
const {z} = require('zod')
const {PrismaClient} = require('@prisma/client')
const {createClient} = require('@clickhouse/client')
const {Kafka} = require('kafkajs')
const {v4: uuidv4} = require('uuid')
const fs = require('fs')
const path = require('path')

const app = express();
const PORT = 9000;

const prisma = new PrismaClient({});

const client = createClient({
    //here in host we have to give port also, so in aiven in your service click on quick connect and find host
    host: '',
    database: 'default',
    username: 'avnadmin',
    password: '',
})
//using this client of clickHouse we can execute queries

const kafka = new Kafka({
    clientId: `api-server`,
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

const consumer = kafka.consumer({groupId: 'api-server-logs-consumer'})

const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const config = {
    CLUSTER: '',
    TASK: '',
}

app.use(express.json());
app.use(cors());

app.post('/project',async(req,res)=>{
    const schema = z.object({
        name: z.string(),
        gitURL: z.string()
    })
    const safeParseResult = schema.safeParse(req.body);
    if(safeParseResult.error){
        return res.status(400).json({error: safeParseResult.error})
    }

    const {name, gitURL} = safeParseResult.data;

    const project = await prisma.project.create({
        data: {
            name, gitURL, subDomain: generateSlug()
        }
    })

    return res.json({status: 'success', data: {project}})
})

app.get('/logs/:id', async(req,res)=>{
    //using poling frontend can access the logs
    const id = req.params.id;
    const logs = await client.query({
        query: `SELECT event_id, deployment_id, log, timestamp from log_events where deployment_id=${deployemnt_id.toString}`,
        query_params: {
            deployemnt_id: id
        },
        format: 'JSONEachRow'
    })
    const rawLogs = await logs.json()
    return res.json({logs: rawLogs});
})

app.post('/deploy', async (req,res)=>{

    const {projectId} = req.body;
    
    const project = await prisma.project.findUnique({where: {id: projectId}})

    if(!project) return res.status(404).json({error: 'Project not found'})

    //TODO: check if there is no running deployment
    const deployment = await prisma.deployemnt.create({
        data: {
            project: {connect: {id: projectId}},
            status: 'QUEUED'
        }
    })

    //spin the container
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [],
                securityGroups: [],
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: '',
                    environment: [
                        //container ko we pass below three things
                        {name: 'GIT_REPOSITORY_URL', value: project.gitURL},
                        {name: 'PROJECT_ID', value: projectId},
                        {name: 'DEPLOYMENT_ID', value: deployment.id},
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command);

    return res.json({status: 'queued', data: {deploymentId: deployment.id}})
})

async function initKafkaConsumer(){
    await consumer.connect();
    await consumer.subscribe({topics: ['container-logs']})

    await consumer.run({
        autoCommit: false,
        eachBatch: async function ({batch,heartbeat,commitOffsetsIfNecessary,resolveOffset}) {
            const messages = batch.messages;
            console.log(`Recv: ${messages.length} messages...`)
            for(const message of messages){
                const stringMessage = message.value.toString();
                const {PROJECT_ID, DEPLOYMENT_ID, log} = JSON.parse(stringMessage);
                try{
                    const {query_id} = await client.insert({
                        table: 'log_events',
                        values: [{event_id: uuidv4(), deployemnt_id: DEPLOYMENT_ID, log: log}],
                        format: 'JSONEachRow'
                    })
                    commitOffsetsIfNecessary(message.offset);
                    resolveOffset(message.resolveOffset);
                    await heartbeat()
                }catch(err){
                    console.log(err);
                }
            }
        }
    })
}
initKafkaConsumer();


app.listen(PORT, ()=> console.log(`API server running..${PORT}`));