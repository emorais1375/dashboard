'use strict';

// Import parts of electron to use
const {app, BrowserWindow, net} = require('electron');
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
// var pouchdb_base = new PouchDB(path.join(__dirname, 'mydb'));

let db_nedb = [
  {name:'login', db : new nedb({filename: 'login.db', autoload: true})},
  {name:'inventario', db : new nedb({filename: 'inventario.db', autoload: true})},
  {name:'agendamento', db : new nedb({filename: 'agendamento.db', autoload: true})},
  {name:'base', db : new nedb({filename: 'base.db', autoload: true})},
  {name:'coleta', db : new nedb({filename: 'coleta.db', autoload: true})},
  {name:'usuario_enderecamento', db : new nedb({filename: 'usuario_enderecamento.db', autoload: true})},
  {name:'enderecamento', db :  new nedb({filename: 'enderecamento.db', autoload: true})},
  {name:'divergencia', db : new nedb({filename: 'divergencia.db', autoload: true})},
  {name:'usuario', db : new nedb({filename: 'usuario.db', autoload: true})} 
]

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Keep a reference for dev mode
let dev = false;
if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
  dev = true;
}

function createWindow() {
  startExpress();
  loadDB();
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024, height: 768, show: false
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
      // mainWindow.webContents.openDevTools();
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => { (process.platform !== 'darwin') && app.quit() }); // On macOS, menu bar

app.on('activate', () => { (mainWindow === null) && createWindow() }); // On macOS, dock

function startExpress () {
  const server = require('./server')
  const mysql = require('mysql')
  const env = require('./.env')

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
        const login_bd = new nedb({filename: 'login.db', autoload: true})
        login_bd.findOne({
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
      } else{
        console.log('CPF ou Senha inválida!')
        res.json({retorno: -1, controle, usuario_id: null,username: null,login: -1, tipo_coleta: null})
      }
    } else {
      res.json({retorno: 0, controle, usuario_id: null,username: null,login: -1, tipo_coleta: null})
      console.log(controle)
    }
  })

  server.get('/inventario', (req, res) => {
    console.log('GET /inventario')
    const inventario_bd = new nedb({filename: 'inventario.db', autoload: true})
    inventario_bd.findOne({id: inventario_id}, (err, invent) => {
      if(err) {
        console.log(err)
        res.json({retorno: -1, controle, error:err})
        return
      } else if(invent) {
        res.json({
          "retorno": 0, 
          "controle": controle,
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
  })

  server.get('/enderecamento', (req, res) => {
    const { usuario_id } = req.query
    console.log('GET /enderecamento?usuario_id='+usuario_id)

    const e_db = new nedb({filename: 'enderecamento.db', autoload: true})
    const ue_db = new nedb({filename: 'usuario_enderecamento.db', autoload: true})
    if (usuario_id) {
      ue_db.find({inventario_id: inventario_id, usuario_id: Number(usuario_id), status: { $ne: 'CONCLUIDO' }},(err, ue) => {
        if(err) {
          console.log(err);
          res.json({retorno: -1, controle, error:err});
          return
        } else {
          e_db.find({ id: { $in : ue.map(p => p.enderecamento_id) }}, (err, e) => {
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
      let coleta_db = new nedb({filename: 'coleta.db', autoload: true})
      coleta_db.insert(coletas, err => {
        if (err) {
          res.json({retorno: -1, controle, error:err})
        } else {
          res.json({retorno: 0, controle, coletas})
        }
      })
    } else {
      res.json({retorno: 0, controle})
      console.log(controle)
    }
  })

  server.get('/base', (req, res) => {
    console.log('GET /base')
    let base_db = new nedb({filename: 'base.db', autoload: true})
    base_db.find({
      inventario_id: inventario_id
    },(err, docs)=>{
      if(err) {
        console.log(err);
        res.json({retorno: -1, controle, error:err});
      } else {
        let base = docs.map(item => ({
          cod_barra: item.item,
          descricao_item: item.descricao_item
        }))
        res.json(base);
      }
    });
    // console.log('GET /base')
    // let connection = mysql.createConnection(env.config_mysql)
    // let query = `
    //   SELECT 
    //     cod_barra, descricao_item
    //   FROM 
    //     base
    //   WHERE
    //     inventario_id = ?
    // `
    // connection.query(query, [inventario_id], (error, results, fields)=>{
    //   if(error) {
    //     console.log(error.code,error.fatal)
    //     res.json({retorno: -1, controle, error:error.code})
    //     return
    //   }
    //   res.json(results)
    //   connection.end()
    // })
  })

  server.post('/end_status', (req, res) => {
    console.log('POST /end_status')
    if (controle === 'play') {
      const coletas  = req.body || []
      let cout_err = 0
      let ue_db = new nedb({filename: 'usuario_enderecamento.db', autoload: true});
      Promise.resolve(
        coletas.map(element => {
          ue_db.update( { 
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
      });
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
      let coleta_db = new nedb({filename: 'coleta.db', autoload: true})
      Promise.resolve(
        coletas.map(element => {
          coleta_db.remove( { 
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
      });
    } else {
      res.json({retorno: 0, controle})
      console.log(controle)
    }
    // console.log('POST /end_delete')
    // if (controle === 'play') {
    //   const coletas  = req.body || []
    //   let values = []
    //   let query = ""

    //   for(var i=0; i< coletas.length; i++){
    //     values.push(
    //       coletas[i].inventario_id,
    //       coletas[i].tipo_coleta,
    //       coletas[i].enderecamento,
    //       coletas[i].data,
    //       coletas[i].hora
    //     )
    //     query = query + "delete from coleta where inventario_id=? and tipo_coleta=? and enderecamento=? and data <= ? and hora <= ?;"
    //   }
    //   console.log(values, query)

    //   let connection = mysql.createConnection(env.config_mysql)
    //   connection.query(query, values, (error, results, fields)=>{
    //     if(error) {
    //       console.log(error.code,error.fatal)
    //       res.json({retorno: -1, controle, error:error.code})
    //       return
    //     }
    //     res.json({retorno: 0, controle, results})
    //     connection.end()
    //   })
    // } else {
    //   res.json({retorno: 0, controle})
    //   console.log(controle)
    // }
  })

  server.get('/', (req, res) => {
    console.log("GET /")
    res.json({message:'Servidor funcionando!'})
  })
}

function loadDB(){
  for (let index = 0; index < db_nedb.length; index++) {
    const db = db_nedb[index];
    if (db.name === 'base') {
      pouchdb_base.find({selector: {}})
      .then(d=>{
        db.db.remove({}, {multi:true})
        db.db.insert(d.docs, (err) => {
          if(err){
            console.log(err); //caso ocorrer algum erro        
            return;
          } else {
            console.log("dados carregados de " + db.name);
          }
        });
      })
      .catch(err => { 
        console.log(err);
      })
    } else {
      let connection = mysql.createConnection(env.config_mysql);
      connection.query('SELECT * FROM ' + db.name +';', [],(error, rows, fields) => {
      if(error){
          console.log(db.name,error.code,error.fatal)
          return;
      }
      connection.end();
      var results = []
      for (var i = 0;i < rows.length; i++) {
        results.push(JSON.parse(JSON.stringify(rows[i])));
      }
      db.db.remove({}, {multi:true})
      db.db.insert(results, function(err){
        if(err){
          console.log(err); //caso ocorrer algum erro        
          return;
        } else {
          console.log("dados carregados de " + db.name);
        }
      }); 
    });
    }
  }
}

const { ipcMain } = require('electron')
ipcMain.on('asynchronous-message', (event, arg) => {
  console.log('Controle: '+arg.controle) // prints "ping"
  controle = arg.controle // 'start' 'pause' 'finalizado'
  tipo_coleta = arg.tipo_coleta
  event.sender.send('asynchronous-reply', 'pong')
})
ipcMain.on('set-inventario', (event, arg) => {
  console.log('Inventario: '+arg) // prints "ping"
  inventario_id = arg // 'start' 'pause' 'finalizado'
})