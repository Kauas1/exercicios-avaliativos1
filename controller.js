import {readFile, writeFile} from 'node:fs'

export const readData = (callback)=>{
    readFile('./pessoas.json', 'utf8', (err,data)=>{
        if(err){
            callback(err)
        }

        try{
            const users = JSON.parse(data)
            callback(null,users)
        }

        catch(error){
            console.error(`Error: ${error}`)
        }
    })
}

export const writeData = (value,callback)=>{
    writeFile('./pessoas.json', JSON.stringify(value, null,2), 
    (err) =>{
        if(err){
            callback(err)
        }else{
            callback(null)
        }
    })
}
