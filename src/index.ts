import * as dotenv from 'dotenv'
import fetch from 'cross-fetch';
import * as fs from 'fs';
import { json2csv } from 'json-2-csv';

dotenv.config()
const baseUrl="https://polkadot.api.subscan.io"
const requestBuilder = async (query: any, type="parachain/contributes")=> {
    const response = await fetch(baseUrl+ `/api/scan/`+ type, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.API_KEY as string
        },
        body: JSON.stringify(query)
    })
    const body = await response.json();
    return body;
}

const createQuery=(row: number, page:number)=>{
    return {
        row:row,
        page:page,
        para_id:2040,
        from_history:false
    }
}
const delay = (ms:number) => new Promise(resolve => setTimeout(resolve, ms))
let start = 1
const mainFn = async ()=>{
    const total_count= 2500//16994;
    let accum=[]
    let page=0
    let i=0;
    let batch=100
    do{
        const query = createQuery(batch, page);
        i+=batch;
        page=page+1;
        //console.log(query)
        let res = await requestBuilder(query);
        //console.log(res)
        if(!res?.data?.contributes){
            break
        }
        const contributes = res.data.contributes;
        console.log("current count", i)
        for(let j=0; j< contributes.length; j++){
            const block_num = contributes[j].block_num;
            const accountId = contributes[j].who;
            const paraId = contributes[j].para_id;
            const amount = contributes[j].contributed;
            accum.push({accountId, paraId, amount, block_num})
        }
        await delay(100)
    }while (i<=total_count)
    let total_contributed =0 ;
    accum.forEach((item)=> total_contributed+=Number(item.amount))
    total_contributed=total_contributed/10**10
    console.log("total contribution: ",total_contributed );
    console.log("total contributors: ", accum.length)
    console.log("deficient: ",973323 - total_contributed)
    json2csv(accum, json2csvCallback, {
        prependHeader: true      // removes the generated header of "value1,value2,value3,value4" (in case you don't want it)
    });
}

const name= "crowdloan"+start+".csv"
let json2csvCallback = function (err:any, csv:any) {
    if (err) throw err;
    fs.writeFile(name, csv, 'utf8', function(err) {
        if (err) {
            console.log('Some error occured - file either not saved or corrupted file saved.');
        } else {
            console.log('It\'s saved!');
        }
    });
};

mainFn()
    .then(()=> console.log("finished"))
    .catch((e)=>console.log("error="+e))