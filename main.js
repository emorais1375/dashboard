'use strict';

const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path')
const url = require('url')
let controle = 'stop' // 'pause' 'play' 'finalizado'
let inventario_id = 0
let tipo_coleta = 'INVENTARIO'
const nedb = require('nedb');
const mysql = require('mysql');
const env = require('./.env');
const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
const pouchdb_base = new PouchDB('https://arkodb-server.herokuapp.com/arko_server');

let db = {}
function getDB(table) {
  if(db[table]) {
    return db[table]
  } else {
    const tableFile = `data/${table}.json`
    let thisDb = new nedb({ 
      filename: tableFile 
    })
    db[table] = thisDb
    return thisDb
  }
}

const userendDb = getDB('usuario_enderecamento')
const userDb = getDB('usuario')

let mainWindow;

let dev = false;
if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
  dev = true;
}

function createWindow() {
  startExpress();
  loadDB();
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024, minWidth: 310, height: 768, minHeight: 395, show: false
  });

  // and load the index.html of the app.
  let indexPath;
  if ( dev && process.argv.indexOf('--noDevServer') === -1 ) {
    indexPath = url.format({
      protocol: 'http:',
      host: 'localhost:4000',
      pathname: 'index.html',
      slashes: true
    });
  } else {
    indexPath = url.format({
      protocol: 'file:',
      pathname: path.join(__dirname, 'dist', 'index.html'),
      slashes: true
    });
  }
  mainWindow.loadURL( indexPath );

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Open the DevTools automatically if developing
    if ( dev ) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { (process.platform !== 'darwin') && app.quit() }); // On macOS, menu bar
app.on('activate', () => { (mainWindow === null) && createWindow() }); // On macOS, dock

function startExpress () {
  const server = require('./server')

  server.get('/login', (req, res) => {
    let cpf = req.query.cpf || ''
    const password = req.query.password || ''
    console.log('GET /login?cpf='+cpf+'&password='+password)
    if (controle === 'play') {
      if (cpf.length === 11 && password) {
        cpf = cpf.split('')
        cpf.splice( 3, 0, '.')
        cpf.splice( 7, 0, '.')
        cpf.splice(11, 0, '-')
        cpf = cpf.join('')
        const loginDb = getDB('login')
        loginDb.loadDatabase(err=>{
          if(!err){
            loginDb.findOne({
              cpf:cpf, 
              password:password, 
              login_status:'ATIVO'
            }, (err, login) => {
              if(err) {
                console.log(err)
                res.json({retorno: -1, controle, error:err})
                return
              } else if(login){
                res.json({
                  retorno: 0,
                  controle: controle,
                  usuario_id: login.usuario_id,
                  username: login.username,
                  tipo_coleta: tipo_coleta,
                  login: 0,
                })
              } else{
                console.log('CPF ou Senha inválida!')
                res.json({retorno: -1, controle, usuario_id: null,username: null,login: -1, tipo_coleta: null})
              }
            })
          } else {
            res.json({retorno: -1, controle, usuario_id: null,username: null,login: -1, tipo_coleta: null})
          }
        })
      } else{
        console.log('CPF ou Senha inválida!')
        res.json({retorno: -1, controle, usuario_id: null,username: null,login: -1, tipo_coleta: null})
      }
    } else {
      res.json({
        retorno: 0, 
        controle, 
        usuario_id: null,
        username: null,
        login: -1, 
        tipo_coleta: null
      })
      console.log(controle)
    }
  })

  server.get('/inventario', (req, res) => {
    console.log('GET /inventario')
    const inventDd = getDB('inventario')
    inventDd.loadDatabase(err=>{
      if(!err){
        inventDd.findOne({id: inventario_id}, (err, invent) => {
          if(err) {
            console.log(err)
            res.json({retorno: -1, controle, error:err})
            return
          } else if(invent) {
            res.json({
              "retorno": 0, 
              "controle": controle,
              "inventario_id": invent.id,
              "tipo_inventario": invent.tipo_inventario,
              "validade": invent.validade,
              "fabricacao": invent.fabricacao,
              "lote": invent.lote,
              "itens_embalagem": invent.itens_embalagem,
              "marca": invent.marca,
              "fornecedor": invent.fornecedor,
              "ignorar_zero_esq": invent.ignorar_zero_esq,
              "ignorar_zero_direita": invent.ignorar_zero_direita
            })
          } else{
            res.json({
              "retorno": 0, 
              "controle": controle,
              "tipo_inventario": null,
              "validade": null,
              "fabricacao": null,
              "lote": null,
              "itens_embalagem": null,
              "marca": null,
              "fornecedor": null,
              "ignorar_zero_esq": null,
              "ignorar_zero_direita": null
            })
          }
        })
      } else {
        res.json({
          "retorno": 0, 
          "controle": controle,
          "tipo_inventario": null,
          "validade": null,
          "fabricacao": null,
          "lote": null,
          "itens_embalagem": null,
          "marca": null,
          "fornecedor": null,
          "ignorar_zero_esq": null,
          "ignorar_zero_direita": null
        })
      }
    })
  })

  server.get('/enderecamento', (req, res) => {
    const { usuario_id } = req.query
    console.log('GET /enderecamento?usuario_id='+usuario_id)

    const userendDb = getDB('usuario_enderecamento')
    const endDb = getDB('enderecamento')
    if (usuario_id) {
      userendDb.loadDatabase(err=>{
        if(!err){
          userendDb.find({inventario_id: inventario_id, usuario_id: Number(usuario_id), status: { $ne: 'CONCLUIDO' }},(err, ue) => {
            if(err) {
              console.log(err);
              res.json({retorno: -1, controle, error:err});
              return
            } else {
              endDb.loadDatabase(err=>{
                if(!err){
                  endDb.find({ id: { $in : ue.map(p => p.enderecamento_id) }}, (err, e) => {
                    if(err) {
                      console.log(err);
                      res.json({retorno: -1, controle, error:err});
                      return
                    } else {
                      let end = e.map(item => ({
                        enderecamento_id: item.id,
                        descricao: item.descricao,
                        excecao: item.excecao
                      }));
                      res.json(end);
                    }
                  });
                } else {
                  res.json({retorno: -1, controle, error:err});
                }
              })
            }
          })
        } else {
          res.json({retorno: -1, controle, error:err});
        }
      })
    } else {
      console.log('usuario_id inválido!')
      res.json({retorno: -1, controle})
    }
  })

  server.post('/coleta', (req, res) => {
    console.log('POST /coleta')
    if (controle === 'play') {
      const coletas  = req.body || []
      console.log(typeof(coletas), coletas)
      const coletaDb = getDB('coleta')
      coletaDb.loadDatabase(err=>{
        if(!err){
          coletaDb.insert(coletas, err => {
            if (err) {
              res.json({retorno: -1, controle, error:err})
            } else {
              res.json({retorno: 0, controle, coletas})
            }
          })
        } else {
          res.json({retorno: -1, controle, error:err})
        }
      })
    } else {
      res.json({retorno: 0, controle})
      console.log(controle)
    }
  })

  server.get('/base', (req, res) => {
    console.log('GET /base')
    let baseDb = getDB('base')
    baseDb.loadDatabase(err=>{
      if(!err){
        baseDb.find({
          inventario: inventario_id
        },(err, docs)=>{
          console.log('base: ',docs)
          if(err) {
            console.log(err);
            res.json({retorno: -1, controle, error:err});
          } else {
            let base = docs.map(item => ({
              cod_barra: item.cod_barras,
              descricao_item: item.descricao_item
            }))
            res.json(base);
          }
        })
      } else {
        res.json({retorno: -1, controle, error:err});
      }
    })
  })

  server.post('/end_status', (req, res) => {
    console.log('POST /end_status')
    if (controle === 'play') {
      const coletas  = req.body || []
      let cout_err = 0
      const userendDb = getDB('usuario_enderecamento')
      userendDb.loadDatabase(err=>{
        if(!err){
          Promise.resolve(
            coletas.map(element => {
              userendDb.update( { 
                enderecamento_id : Number(element.enderecamento_id), 
                inventario_id : Number(element.inventario_id), 
                tipo: tipo_coleta 
              }, { $set: { status : element.status } }, {multi: true}, err => {
                if (err) {
                  cout_err++;
                }
              })
            })
          ).then(() => {
            if (cout_err) {
              res.json({retorno: -1, controle, error: ''})
            } else{
              res.json({retorno: 0, controle, coletas})
            }
          })
        } else {
          res.json({retorno: -1, controle, error: err})
        }
      })
    } else {
      res.json({retorno: 0, controle})
      console.log(controle)
    }
  })

  server.post('/end_delete', (req, res) => {
    console.log('POST /end_delete')
    if (controle === 'play') {
      const coletas  = req.body || []
      let cout_err = 0
      const coletaDb = getDB('coleta')
      coletaDb.loadDatabase(err=>{
        if(!err){
          Promise.resolve(
            coletas.map(element => {
              coletaDb.remove( { 
                inventario_id : Number(element.inventario_id), 
                tipo_coleta : element.tipo_coleta, 
                enderecamento: element.enderecamento,
                data: { $lte: element.data },
                hora: { $lte: element.hora }
              }, {multi: true}, err => {
                if (err) {
                  cout_err++;
                }
              })
            })
          ).then(() => {
            if (cout_err) {
              res.json({retorno: -1, controle, error: ''})
            } else{
              res.json({retorno: 0, controle, coletas})
            }
          })
        } else {
          res.json({retorno: -1, controle, error: err})
        }
      })
    } else {
      res.json({retorno: 0, controle})
      console.log(controle)
    }
  })

  server.get('/', (req, res) => {
    console.log("GET /")
    res.json({message:'Servidor funcionando!'})
  })
}

function loadDB(){
  // Falta Update status, hora e data no inventario
  const coletaDb = getDB('coleta')
  // const userendDb = getDB('usuario_enderecamento')
  const endDb = getDB('enderecamento')
  
  Promise.resolve(
    // Atualiza enderecamento se tiver id e alterado
    endDb.loadDatabase( err => {
      if(!err){
        endDb.find({ novo: { $exists: false }, alterado: true }, (err, e)=>{
          if (!err && e.length) {
            let values = []
            let query = ""
            e.forEach(i=>{
              values.push(
                i.excecao,
                i.id
              )
              query = query + "UPDATE enderecamento SET excecao = ? WHERE id = ?;"
            })
            const connectionUri = env.config_mysql
            let connection = mysql.createConnection(connectionUri);

            connection.query(query, values, (err, results, fields)=>{
              if(err) {
                console.log(`falha ao sincronizar enderecamento: ${err.code}, ${err.stack}`)
                return
              }
              e.forEach(i => {
                endDb.update({
                  _id: i._id
                }, { $set: { alterado : false } }, err =>{
                  if(err){
                    console.log('enderecamento erro ao sincronizar')
                  }
                })
              })
              connection.end()
            })
          }
        })
      }
    })
  ).then(
    // Inserir novo enderecamento id falso e novo
    endDb.loadDatabase( err => {
      if (!err) {
        endDb.find({ novo: true }, (err, e) => {
          if (!err && e.length) {
            let values = []
            for(var i=0; i< e.length; i++)
              values.push([
                e[i].inventario_id,
                e[i].descricao,
                e[i].descricao_proprietario,
                e[i].excecao
              ])
            const connectionUri = env.config_mysql
            let connection = mysql.createConnection(connectionUri);
            let query = `
              INSERT INTO 
                enderecamento (inventario_id, descricao, descricao_proprietario, excecao)
              VALUES ?
            `

            connection.query(query, [values], (err, results, fields)=>{
              if(err) {
                console.log(`falha ao sincronizar enderecamento: ${err.code}, ${err.stack}`)
                return
              }
              for (let newId = results.insertId; newId < (results.insertId + results.affectedRows); newId++) {
                endDb.update({
                  _id: e[newId-results.insertId]._id
                }, { $set: { id : newId } }, err =>{
                  if(err){
                    console.log('enderecamento erro ao sincronizar')
                  }
                })
                userendDb.loadDatabase( err => {
                  if(!err){
                    userendDb.update({
                      _enderecamento_id: e[newId-results.insertId]._id
                    }, { $set: { enderecamento_id : newId } }, err =>{
                      if(err){
                        console.log('enderecamento erro ao sincronizar')
                      }
                    })
                  }
                })
              }
              connection.end()
            })
          }
        })
      }
    })
  ).then(
    // inserir novo userend sem id
    userendDb.loadDatabase( err => {
      if(!err){
        userendDb.find({ 
          id: { $exists: false },
          deletado: { $exists: false } 
        }, (err, user_end) => {
          if (!err && user_end.length) {
            let values = []
            for(var i=0; i< user_end.length; i++)
              values.push([
                user_end[i].inventario_id,
                user_end[i].usuario_id,
                user_end[i].enderecamento_id,
                user_end[i].status
              ])
            const connectionUri = env.config_mysql
            let connection = mysql.createConnection(connectionUri);
            let query = `
              INSERT INTO 
                usuario_enderecamento (inventario_id, usuario_id, enderecamento_id, status)
              VALUES ?
            `
            connection.query(query, [values], (err, results, fields)=>{
              if(err) {
                console.log(`falha ao sincronizar usuario_enderecamento: ${err.code}`)
                return
              }
              for (let newId = results.insertId; newId < (results.insertId + results.affectedRows); newId++) {
                userendDb.update({
                  _id: user_end[newId-results.insertId]._id
                }, { $set: { id : newId } }, err =>{
                  if(err){
                    console.log('usuario_enderecamento erro ao sincronizar')
                  }
                })
              }
              connection.end()
            })
          }
        })
      }
    })
  ).then(
    // Deletar userend que tiver id
    userendDb.loadDatabase( err => {
      if(!err){
        userendDb.find({
          id: { $exists: true },
          deletado: true
        }, (err, user_end) => {
          if (!err && user_end.length) {
            let values = []
            let query = ""
            for(var i=0; i< user_end.length; i++){
              values.push(
                user_end[i].id
              )
              query = query + "DELETE FROM usuario_enderecamento WHERE id = ?;"
            }
            const connectionUri = env.config_mysql
            let connection = mysql.createConnection(connectionUri);
            connection.query(query, values, (err, results, fields)=>{
              if(err) {
                console.log(`falha ao sincronizar usuario_enderecamento: ${err.code}`)
                return
              }
              user_end.forEach(i => {
                userendDb.remove({
                  _id: i._id
                }, {multi:true}, err =>{
                  if(err){
                    console.log('usuario_enderecamento erro ao sincronizar')
                  }
                })
              })
              connection.end()
            })
          }
        })
      }
    })
  ).then(
    coletaDb.loadDatabase(err =>{
      if(!err){
        coletaDb.find({ id: { $exists: false } }, function (err, coletas) {
          if (!err && coletas.length) {
            let values = []
            for(var i=0; i< coletas.length; i++)
              values.push([
                coletas[i].inventario_id,
                coletas[i].usuario_id,
                coletas[i].data,
                coletas[i].hora,
                coletas[i].enderecamento,
                coletas[i].cod_barra,
                coletas[i].validade,
                coletas[i].fabricacao,
                coletas[i].lote,
                coletas[i].itens_embalagem,
                coletas[i].marca,
                coletas[i].fornecedor
              ])
            const connectionUri = env.config_mysql
            let connection = mysql.createConnection(connectionUri);
            let query = `
              INSERT INTO 
                coleta (inventario_id,usuario_id, data, hora, enderecamento,
                        cod_barra, validade, fabricacao,
                        lote, itens_embalagem, marca, fornecedor)
              VALUES ?
            `

            connection.query(query, [values], (err, results, fields)=>{
              if(err) {
                console.log(`falha ao sincronizar coleta: ${err.code}`)
                return
              }
              for (let newId = results.insertId; newId < (results.insertId + results.affectedRows); newId++) {
                coletaDb.update({
                  _id: coletas[newId-results.insertId]._id
                }, { $set: { id : newId } }, err =>{
                  if(err){
                    console.log('Coleta erro ao sincronizar')
                  }
                })
              }
              connection.end()
            })
          }
        })
      }
    })
  ).then(
    // Receber os dados do servidor
    [
      'login',
      'inventario',
      'agendamento',
      'base',
      'coleta', 
      'usuario_enderecamento',
      'enderecamento',
      'divergencia',
      'usuario'
    ].map(db=>{
      const allDb = getDB(db)
      if (db === 'base') {
        pouchdb_base.find({selector: {}}, (err, d) => {
          if(err){
            return console.log(`falha ao carregar dados de ${db}, ${err}`)
          } else if(!d.docs.length){
            return console.log(`dados carregados de ${db}, porem o servidor está vazio`)
          } else {
            allDb.loadDatabase( err => {
              if(!err){
                allDb.remove({}, {multi:true}, (err, n) => {
                  if (err) {
                    return console.log(`falha ao remover dados de base, ${err}`);
                  } else {
                    allDb.insert(d.docs, (err) => {
                      if(err){
                        return console.log(`falha ao inserir dados de base, ${err}`);
                      } else {
                        return console.log(`dados carregados de base`);
                      }
                    })
                  }
                })
              }
            })
          }
        })
      } else {
        const connectionUri = env.config_mysql
        let connection = mysql.createConnection(connectionUri);
        connection.query(`SELECT * FROM ${db};`, [],(err, rows, fields) => {
          if(err){
            return console.log(`falha ao carregar dados de ${db}, ${err.code}, ${err.fatal}`)
          }
          connection.end()
          var results = []
          for (var i = 0;i < rows.length; i++) {
            results.push(JSON.parse(JSON.stringify(rows[i])));
          }
          allDb.loadDatabase( err => {
            if(!err){
              allDb.remove({}, {multi:true}, (err) => {
                if (err) {
                  console.log(`falha ao remover dados de ${db}, ${err}`);
                } else {
                  allDb.insert(results, (err) => {
                    if(err){
                      console.log(`falha ao inserir dados de ${db}, ${err}`); //caso ocorrer algum erro        
                    } else {
                      console.log("dados carregados de " + db);
                    }
                  })
                }
              })
            }
          })
        })
      }
    })
  )
}

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log('Controle: '+arg.controle) // prints "ping"
  controle = arg.controle // 'start' 'pause' 'finalizado'
  tipo_coleta = arg.tipo_coleta
})
ipcMain.on('set-inventario', (event, arg) => {
  console.log('Inventario: '+arg) // prints "ping"
  inventario_id = arg // 'start' 'pause' 'finalizado'
})
ipcMain.on('loadDB', (event, arg) => {
  loadDB()
})
ipcMain.on('insert-base', (event, arg) => {
  const baseDB = getDB('base')
  baseDB.loadDatabase( err => {
    if(!err){
      baseDB.remove({}, {multi:true}, (err, numRemoved) => {
        if (err) {
          console.log(`Erro 1 ao importar itens na base, cod: ${err}`);
        } else {
          baseDB.insert(arg, (err) => {
            if(err){
              console.log(`Erro 2 ao importar itens na base, cod: ${err}`); //caso ocorrer algum erro
            } else {
              console.log("dados carregados de base");
            }
          }); 
        }
      })
    }
  })
})
ipcMain.on('getBase', (event, arg) => {
  const db = getDB(arg)
  db.loadDatabase( err => {
    if(!err){
      db.find({inventario: inventario_id}, (err, docs)=>{
        if(!err) event.returnValue = docs
        else event.returnValue = []
      })
    } else{
      event.returnValue = []
    }
  })
})
ipcMain.on('getEnd', (event, inventario_id) => {
  // Retornar enderecamento com status que esta em userend
  const endDb = getDB('enderecamento')
  const userendDb = getDB('usuario_enderecamento')
  endDb.loadDatabase( err => {
    if(!err){
      endDb.find({
        inventario_id: Number(inventario_id)
      }, (err, e)=>{
        userendDb.loadDatabase( err => {
          if(!err){
            userendDb.find({
              inventario_id: Number(inventario_id),
              enderecamento_id: { $in: e.map(i=>i.id) }
            }, (err, ue)=>{
              let enderecamento  = e.map(i=>{
                const ue_tmp = ue.find(it=>it.enderecamento_id===i.id)
                i['status'] = ue_tmp?ue_tmp.status:'ATIVADO'
                return i
              })
              event.returnValue = enderecamento
            })
          } else 
            event.returnValue = []
        })
      })
    } else 
      event.returnValue = []
  })
})
ipcMain.on('insertUserEnd', (event, enderecamento) => {
  const userendDb = getDB('usuario_enderecamento')
  const end_new = enderecamento.filter(i=>i.deletado!==true)
  const end_old = enderecamento.filter(i=>i.deletado===true).map(i=>i._id)
  userendDb.loadDatabase(err => {
    if(!err){
      userendDb.insert(end_new, err =>{
        if(err){
          event.returnValue = false
        } else {
          userendDb.update({
            _id: {$in: end_old}
          }, { $set: { deletado : false } }, {multi: true}, err=>{
            event.returnValue = !err ? true : false
          })
        }
      })
    } else {
      event.returnValue = false
    }
  })
})
ipcMain.on('getEndDesc', (event, inventario_id) => {
  const endDb = getDB('enderecamento')
  endDb.loadDatabase(err=>{
    if(!err){
      endDb.find({
        inventario_id: Number(inventario_id)
      }, (err, docs)=>{
        event.returnValue = docs
      })
    } else {
      event.returnValue = []
    }
  })
})
ipcMain.on('updateEnd', (event, {excecao, _id}) => {
  const endDb = getDB('enderecamento')
  endDb.loadDatabase(err => {
    if(!err){
      endDb.update({
        _id: _id.toString()
      }, { $set: { excecao : excecao, alterado : true } }, err =>{
        event.returnValue = !err ? true : false
      })
    } else {
      event.returnValue = false
    }
  })
})
ipcMain.on('insertEnd', (event, arg) => {
  const endDb = getDB('enderecamento')
  endDb.loadDatabase(err=>{
    if(!err){
      endDb.find({}, (err, doc)=>{
        let ultimo_id = Math.max(...doc.map(i=>i.id))
        const arg2 = arg.map(i=>{
          ultimo_id += ultimo_id
          i['id'] = Number(ultimo_id)
          return i
        })
        endDb.insert(arg2, err =>{
          event.returnValue = !err ? true : false
        })
      })
    } else {
      event.returnValue = false
    }
  })
})
ipcMain.on('delUserEnd', (event, user_end_ids) => {
  const userendDb = getDB('usuario_enderecamento')
  userendDb.loadDatabase(err=>{
    if(!err){
      userendDb.update({
        _id: {$in: user_end_ids}
      }, { $set: { deletado : true } }, {multi: true}, err=>{
        event.returnValue = !err ? true : false
      })
    } else {
      event.returnValue = false
    }
  })
})
ipcMain.on('getUserEnd', (event, inventario_id) => {
  const userendDb = getDB('usuario_enderecamento')
  const endDb = getDB('enderecamento')
  const userDb = getDB('usuario')
  let usuario_enderecamento = []
  userendDb.loadDatabase(err => {
    if(!err){
      userendDb.find({
        inventario_id: Number(inventario_id),
        deletado: { $exists: false } 
      }, (err, ue)=>{
        endDb.loadDatabase(err=>{
          if(!err){
            endDb.find({
              id: {
                $in: ue.map(i=>i.enderecamento_id)
              }}, (err, e)=>{
                userDb.loadDatabase(err=>{
                  if(!err){
                    userDb.find({id: {$in: ue.map(i=>i.usuario_id)}}, (err, u)=>{
                      usuario_enderecamento = ue.map(i=>{
                        i['nome'] = (u.find(it=>it.id===i.usuario_id)).nome
                        i['descricao'] = (e.find(it=>it.id===i.enderecamento_id)).descricao
                        return i
                      })
                      event.returnValue = usuario_enderecamento.sort((a,b)=>{
                        return a.descricao.split('-')[1] - b.descricao.split('-')[1];
                      })
                    })
                  } else {
                    event.returnValue = []
                  }
                })
            })
          } else {
            event.returnValue = []
          }
        })
      })
    } else {
      event.returnValue = []
    }
  })
})
ipcMain.on('getNomes', (event, inventario_id) => {
  const userDb = getDB('usuario')
  const loginDb = getDB('login')
  loginDb.loadDatabase(err=>{
    if(!err){
      loginDb.find({login_status: 'ATIVO'}, (err, lg)=>{
        if (!err) {
          userDb.loadDatabase(err=>{
            if(!err){
              userDb.find({id: { $in: lg.map(i=>i.usuario_id)}, cargo: 'INVENTARIANTE'}, (err, u)=>{
                event.returnValue = u
              })
            } else {
              event.returnValue = []
            }
          })
        } else {
          console.log(`Erro: Não foi possível abrir login.json, cod: ${err}`)
          event.returnValue = []
        }
      })
    } else {
      event.returnValue = []
    }
  })
})
ipcMain.on('getEquipe', (event, inventario_id) => {
  // const userendDb = getDB('usuario_enderecamento')
  // const userDb = getDB('usuario')
  userendDb.loadDatabase(err=>{
    if(!err){
      userendDb.find({inventario_id: Number(inventario_id)}, (err, ue)=>{
        if (!err) {
          userDb.loadDatabase( err =>{
            if(!err){
              userDb.find({id: { $in: ue.map(i=>i.usuario_id)}}, (err, u)=>{
                if (!err) {
                  Promise.resolve(
                    u.map(i=>({
                      usuario_id: i.id, 
                      nome: i.nome, 
                      qtd_enderecamento: ue.filter(it=>it.usuario_id===i.id && it.deletado!==true).length, 
                      qtd_concluido: ue.filter(it=>it.usuario_id===i.id && it.status==='CONCLUIDO' && it.deletado!==true).length,
                    }))
                  ).then((data)=> {
                    event.returnValue = data
                  })
                } else{
                  console.log(`Erro: Não foi possível abrir usuario.json, cod: ${err}`)
                  event.returnValue = { equipe: [], progressTotal: 0 }
                }
              })
            } else {
              event.returnValue = { equipe: [], progressTotal: 0 }
            }
          })
        } else {
          console.log(`Erro: Não foi possível abrir usuario_enderecamento.json, cod: ${err}`)
          event.returnValue = { equipe: [], progressTotal: 0 }
        }
      })
    } else {
      event.returnValue = { equipe: [], progressTotal: 0 }
    }
  })
})
ipcMain.on('updateBase', (event, rows) => {
  const baseDb = getDB('base')
  let cout_err = 0

  baseDb.loadDatabase(err=>{
    if(!err){
      Promise.resolve(
        rows.slice(1).forEach( element => {
          baseDb.update({
            'cod_barra': element[0].toString(),
            'inventario_id': Number(inventario_id)
          }, { $set: { saldo_estoque : Number(element[1]) } }, {multi: false}, (err)=>{
            if (err) cout_err++;
          })
        })
      ).then(() => {
        event.returnValue = cout_err
      })
    } else {
      event.returnValue = 1 
    }
  })
})
ipcMain.on('getColeta', (event, arg) => {
  const coletaDb = getDB('coleta')
  coletaDb.loadDatabase(err=>{
    if(!err){
      coletaDb.find({inventario_id: inventario_id}, (err, docs)=>{
        event.returnValue = docs
      })
    } else {
      event.returnValue = []
    }
  })
})
ipcMain.on('log', (event, message) => {
  console.log(message);
})