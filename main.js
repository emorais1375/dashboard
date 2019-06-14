'use strict';

// Import parts of electron to use
const {app, BrowserWindow, net} = require('electron');
const path = require('path')
const url = require('url')
let controle = 'stop' // 'pause' 'play' 'finalizado'
let inventario_id = 0
let tipo_coleta = 'INVENTARIO'
var nedb = require('nedb');
var mysql = require('mysql');
const env = require('./.env')

var db_nedb = [
  {name:'login', db : new nedb({filename: 'login.db', autoload: true})},
  {name:'inventario', db : new nedb({filename: 'inventario.db', autoload: true})},
  {name:'agendamento', db : new nedb({filename: 'agendamento.db', autoload: true})},
  {name:'base', db : new nedb({filename: 'base.db', autoload: true})},
  {name:'coleta', db : new nedb({filename: 'coleta.db', autoload: true})},
  {name:'usuario_enderecamento', db : new nedb({filename: 'usuario_enderecamento.db', autoload: true})},
  {name:'enderecamento', db :  new nedb({filename: 'enderecamento.db', autoload: true})},
  {name:'divergencia', db : new nedb({filename: 'divergencia.db', autoload: true})} ,
  {name:'usuario', db : new nedb({filename: 'usuario.db', autoload: true})} 
]
/*
var PouchDB = require('pouchdb');
var db = new PouchDB('importacaoTeste');
var remoteCouch = false;
let url_server_pouch = 'https://arkodb-server.herokuapp.com/arko_teste_server';

//replica o banco do servidor, para o banco local
db.replicate.from(url_server_pouch).on('complete', function(info) {
        console.log("trouxe os dados");
        console.log(info);
    });

// ids_inventarios é um array
function pegaRegistrosInventarios(ids_inventarios){
    db.find({
        selector: {
            // os valores no array, representam os valores do inventario
          inventario: {$in:ids_inventarios}
          }
      }).then(function (result) {
        console.log(result.docs);
      }).catch(function (err) {
        // ouch, an error
        console.log(err);
      });
}
*/


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
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

function startExpress () {
  const server = require('./server')
  const mysql = require('mysql')
  const env = require('./.env')

  //const inventario_id = 1
  //const tipo_coleta = 'INVENTARIO'
  // let cargo = tipo_coleta==='AUDITORIA2'?'EXTERNO':'INVENTARIANTE' // 'EXTERNO'

  server.get('/login', (req, res) => {

      let cargo = tipo_coleta==='AUDITORIA2'?'EXTERNO':'INVENTARIANTE' // 'EXTERNO'
      let cpf = req.query.cpf || ''
      const pass = req.query.password || ''
      console.log('GET /login?cpf='+cpf+'&password='+pass)
    if (controle === 'play') {
      if (cpf.length === 11 && pass) {
        cpf = cpf.split('')
        cpf.splice( 3, 0, '.')
        cpf.splice( 7, 0, '.')
        cpf.splice(11, 0, '-')
        cpf = cpf.join('')
        let connection = mysql.createConnection(env.config_mysql)
        let query = `
          SELECT DISTINCT 
            l.usuario_id, l.username, ue.tipo tipo_coleta
          FROM 
            login l, usuario u, usuario_enderecamento ue
          WHERE 
            l.login_status = 'ATIVO'
          AND 
            l.usuario_id = u.id
          AND 
            u.cargo = ?
          AND 
            l.usuario_id = ue.usuario_id
          AND 
            ue.inventario_id = ?
          AND
            ue.tipo = ?
          AND 
            l.password = ?
          AND 
            l.cpf = ?
        `
        connection.query(query, [cargo, inventario_id, tipo_coleta, pass, cpf], (error, results, fields)=>{
          if(error) {
            console.log(error.code,error.fatal)
            res.json({retorno: -1, controle, error:error.code})
            return
          }
          if (results.length) {
            let newresults = results[0]
            newresults['retorno'] = 0
            newresults['controle'] = controle
            newresults['login'] = 0
            res.json(newresults)
          }
          else {
            console.log('CPF ou Senha inválida!')
            res.json({retorno: -1, controle, usuario_id: null,username: null,login: -1, tipo_coleta: null})
          }
          connection.end()
        })
      } else {
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
    let connection = mysql.createConnection(env.config_mysql)
    let query = `
      SELECT 
        id inventario_id, tipo_inventario, validade,
        fabricacao, lote, itens_embalagem,
        fornecedor, ignorar_zero_esq,
        ignorar_zero_direita, marca
      FROM inventario
      WHERE id = ?
    `
    connection.query(query, [inventario_id], (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal)
        res.json({retorno: -1, controle, error:error.code})
        return
      }
      if(results.length){
        let newresults = results[0]
        newresults['retorno'] = 0
        newresults['controle'] = controle
        res.json(newresults)
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
      connection.end()
    })
  })

  server.get('/enderecamento', (req, res) => {
    const { usuario_id } = req.query
    console.log('GET /enderecamento?usuario_id='+usuario_id)
    if (usuario_id) {
      let connection = mysql.createConnection(env.config_mysql)
      let query = `
        SELECT 
          ue.enderecamento_id, 
          e.descricao,
          e.excecao
        FROM 
          usuario_enderecamento ue, 
          enderecamento e
        WHERE 
          ue.inventario_id = ?
        AND
          ue.tipo = ?
        AND
          e.inventario_id = ?
        AND 
          ue.usuario_id = ?
        AND
          ue.status != 'CONCLUIDO'
        AND 
          ue.enderecamento_id = e.id
      `
      connection.query(query, [inventario_id, tipo_coleta, inventario_id, usuario_id], 
        (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal)
          res.json({retorno: -1, controle, error:error.code})
          return
        }
        res.json(results)
        connection.end()
      });
    } else {
      console.log('usuario_id inválido!')
      res.json({retorno: -1, controle})
    }
  })

  server.post('/coleta', (req, res) => {
    console.log('POST /coleta')
    if (controle === 'play') {
      const coletas  = req.body || []
      let values = []

      for(var i=0; i< coletas.length; i++)
        values.push([
          coletas[i].inventario_id,
          coletas[i].tipo_coleta,
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
      let connection = mysql.createConnection(env.config_mysql)
      let query = `
        INSERT INTO 
          coleta (inventario_id, tipo_coleta, usuario_id, data, hora, enderecamento,
                  cod_barra, validade, fabricacao,
                  lote, itens_embalagem, marca, fornecedor)
        VALUES ?
      `
      
      console.log(values, query)
      connection.query(query, [values], (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal)
          res.json({retorno: -1, controle, error:error.code})
          return
        }
        res.json({retorno: 0, controle, results})
        connection.end()
      })
    } else {
      res.json({retorno: 0, controle})
      console.log(controle)
    }
  })

  server.get('/base', (req, res) => {
    console.log('GET /base')
    let connection = mysql.createConnection(env.config_mysql)
    let query = `
      SELECT 
        cod_barra, descricao_item
      FROM 
        base
      WHERE
        inventario_id = ?
    `
    connection.query(query, [inventario_id], (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal)
        res.json({retorno: -1, controle, error:error.code})
        return
      }
      res.json(results)
      connection.end()
    })
  })

  server.post('/end_status', (req, res) => {
    console.log('POST /end_status')
    if (controle === 'play') {
      const coletas  = req.body || []
      let values = []
      let query = ""

      for(var i=0; i< coletas.length; i++){
        values.push(
          coletas[i].status,
          coletas[i].enderecamento_id,
          coletas[i].inventario_id,
          tipo_coleta
        )
        query = query + "UPDATE usuario_enderecamento SET status = ? WHERE enderecamento_id = ? AND inventario_id = ? AND tipo = ?;"
      }
      console.log(values, query)


      let connection = mysql.createConnection(env.config_mysql)
      connection.query(query, values, (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal)
          res.json({retorno: -1, controle, error:error.code})
          return
        }
        res.json({retorno: 0, controle, results})
        connection.end()
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
      let values = []
      let query = ""

      for(var i=0; i< coletas.length; i++){
        values.push(
          coletas[i].inventario_id,
          coletas[i].tipo_coleta,
          coletas[i].enderecamento,
          coletas[i].data,
          coletas[i].hora
        )
        query = query + "delete from coleta where inventario_id=? and tipo_coleta=? and enderecamento=? and data <= ? and hora <= ?;"
      }
      console.log(values, query)

      let connection = mysql.createConnection(env.config_mysql)
      connection.query(query, values, (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal)
          res.json({retorno: -1, controle, error:error.code})
          return
        }
        res.json({retorno: 0, controle, results})
        connection.end()
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
  db_nedb.forEach(db => {
    let connection = mysql.createConnection(env.config_mysql);
    connection.query('SELECT * FROM ' + db.name +';', [],(error, rows, fields) => {
    if(error){
        console.log(error.code,error.fatal)
        return
    }
    connection.end();
    var results = []
    for (var i = 0;i < rows.length; i++) {
      results.push(JSON.parse(JSON.stringify(rows[i])));
    }
    db.db.remove({}, {multi:true})
    db.db.insert(results, function(err){
      if(err)return console.log(err); //caso ocorrer algum erro        
      console.log("dados carregados de " + db.name);
    }); 
  });
});}

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