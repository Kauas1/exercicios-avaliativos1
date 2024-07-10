import {v4 as uuidv4} from 'uuid'
import {createServer} from 'node:http'
import {writeData, readData} from './controller.js'

const PORT = 3333

const server = createServer((req,res)=>{
    // Obtendo o método e a URL da requisição:
    const {method, url} = req

    // Função para o retorno dos dados em foramto de string JSON
    const writeResponse = (status, resEnd = "Task finalizada com sucesso") => {
        res.writeHead(status, {"Content-Type": "application/json"})
        res.end(JSON.stringify(resEnd))
        return console.log(message + '/n')
    }
    
    //Lendo o arquivo pessoas.json

    readData((error,data)=>{
        if(error){
            return writeResponse(500, {message: "Erro ao ler os dados."})
        }

        // Declarando os endpoints:

        // Cadastro de pessoas
        if(method === 'POST' && url === '/pessoas'){
            console.log(`${method} ${url}`)

            let body = ""

            req.on('data', (chunk)=> {body += chunk})
            req.on('end', ()=>{
                const newUser = JSON.parse(body)

                if(!Object.hasOwn(newUser, "nome") || !Object.hasOwn(newUser, "idade") || !Object.hasOwn(newUser, "email") ){
                    return writeResponse(400, {message: "Dados insuficientes."})
                }else if(data.some((user) => user.email === newUser.email)){
                    return writeResponse(403, {message: "O e-mail já está sendo utilizado."})
                }

                newUser.id = uuidv4()
                data.push(newUser)

                writeData(data, (err)=>{
                    if(err){
                        return writeResponse(500, {message: "Erro ao adicionar dados."})
                    }
                    writeResponse(201, {message: "Usuário cadastrado com sucesso", usuario: newUser})
                    
                })
            })
            // Cadastro de Endereço
        } else if(method === 'POST' && url.startsWith('/pessoas/endereco/')){
            const id = url.split('/')[3]

            const index = data.findIndex((user) => user.id === id)

            if(index === -1){
                return writeResponse(404, {message: "Usuário não encontrado."})
            }

            let body = ""

            req.on('data', (chunk) => {body += chunk})
            req.on('end', ()=>{
                const newAddress = JSON.parse(body)

                if(!Object.hasOwn(newAddress, "rua") || !Object.hasOwn(newAddress, "numero") || !Object.hasOwn(newAddress, "cidade") ||
                !Object.hasOwn(newAddress, "estado") || !Object.hasOwn(newAddress, "cep")){
                    return writeResponse(400, {message: "Dados insuficientes."})
                }

                data[index]= {
                    ...data[index], endereco: newAddress
                }

                writeData(data, (err)=>{
                    if(err){
                        return writeResponse(500, {
                            message: "Erro ao adicionar dados"
                        })
                    }

                    writeResponse(201, {message: "Endereço adicionado com sucesso.", 
                    usuario: data[index]

                    })
                })
            })
            // Cadastro de Telefone
        }else if(method === 'POST' && url.startsWith('/pessoas/telefone/')){

            const id = url.split('/')[3]

            const index = data.findIndex((user)=> user.id === id)

            if(index === -1){
                return writeResponse(404, {message: "O usuário pesquisado não foi encontrado."})
            }

            let body = ""

            req.on('data', (chunk)=> (body += chunk))
            req.on('end', ()=>{
                const phoneNumbers = JSON.parse(body)

                const areNumbersValid = phoneNumbers.every(num =>  Object.hasOwn(num, "tipo") && Object.hasOwn(num, "numero"))

                if(!areNumbersValid){
                    return writeResponse(400, {message: "Dados insuficientes."})

                }

                data[index] = {
                    ...data[index],
                    telefone: phoneNumbers
                }

                writeData(data, (err)=>{
                    if(err){
                        return writeResponse(500, {message:"Erro ao adicionar dados."})
                    }

                    writeResponse(201, {message: "Telefone adicionado com sucesso.",
                        usuario: data[index]
                    })
                })
            })

            // Visualização de Pessoa 
        }else if(method === 'GET' && url.startsWith('/pessoas/')){
            const id = url.split('/')[2]

            const user = data.find((user)=> user.id === id)
        
            if(!user){
                writeResponse(401, {message: "Usuário não encontrado."})
            }else{
                writeResponse(201, user)
            }

            // Listando todas as pessoas
        }else if(method === "GET" && url === ('/pessoas')){
            writeResponse(200, data)
        }
        
        
        else if(method === 'PUT' && url.startsWith('/pessoas/endereco')){
            const id = url.split('/')[3]

            const index = data.findIndex((user)=> user.id === id)

            if(index === -1){
                writeResponse(404, {message: "O usuário pesquisado não foi encontrado."})
            }

            let body = ""

            req.on('data', (chunk) => {body += chunk})
            req.on('end', ()=>{
                const updtAddress = JSON.parse(body)

                if(!Object.hasOwn(updtAddress, "rua") && !Object.hasOwn(updtAddress, "numero") && !Object.hasOwn(updtAddress, "cidade") &&
                !Object.hasOwn(updtAddress, "estado") && !Object.hasOwn(updtAddress, "cep")){
                    return writeResponse(400, {message: "Dados insuficientes."})
                }

                data[index].endereço = {
                    ...data[index].endereço,
                    ...updtAddress
                }
                writeData(data, (err)=>{
                    if(err){
                        writeResponse(500, {message: "Erro interno no servidor."})

                    }

                    writeResponse(201, {message: "Endereço atualizado com sucesso",
                    usuario: data[index]}
                    )
                })
            })

            // Deletando os telefones.
        }if(method === "DELETE" && url.startsWith('/pessoas/telefone')){
            const id = url.split('/')[3]

            const index = data.findIndex((user)=> user.id === id)

            if(index === -1){
                return writeResponse(401, {message: "O número do usuário não foi encontrado."})
            }
            let body = ""

            req.on('data', (chunk)=> {body += chunk})
            req.on('end', ()=>{
                const phoneToBeDel = JSON.parse(body)

                let phoneType = "", phoneNumber = ""
                if(Object.hasOwn(phoneToBeDel, "tipo") || Object.hasOwn(phoneToBeDel, "numero")){
                    phoneType =  phoneType = Object.hasOwn(phoneToBeDel, "tipo") ? phoneToBeDel.tipo : ""
                    phoneNumber = Object.hasOwn(phoneToBeDel, "numero") ? phoneToBeDel.numero : ""
                }else{
                    return writeResponse(400, {message: "Dados insuficientes."})
                }
        
                data[index].telefone.forEach(tel, i => {
                    if(tel.tipo === phoneType|| tel.numero === phoneNumber ){
                        data[index].telefone.splice(i,1)
                    }
                });
        
                writeData(data, (err)=>{
                    if(err){
                        return writeResponse(500, {
                            message: "Erro ao remover os dados"
                        })
                        
                    }
                    writeResponse(201, {
                        message: "Usuário deletado com sucesso.",  
                        usuario: data[index]
                    })
            })
        })

    }else{
        writeResponse(404, {message:"A rota não foi encontrada ou é inexistente."})
    }  
        })

    })

server.listen(PORT, ()=>{
    console.log(`Servidor na Rota ${PORT}`)
})