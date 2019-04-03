'use strict';

// Import parts of electron to use
const {app, BrowserWindow} = require('electron');
const path = require('path')
const url = require('url')

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

  server.get('/login', (req, res) => {
    let resp = {
      login: -1,
      id_usuario: null,
      usuario: null
    }
    let cpf = req.query.cpf;
    let pass = req.query.password;
    let inventario_id = 1;
    let sql = "\
    SELECT DISTINCT l.usuario_id, l.username\
    FROM login l, usuario u, usuario_enderecamento ue\
    WHERE l.login_status = 'ATIVO'\
    AND l.usuario_id = u.id\
    AND u.cargo = 'INVENTARIANTE'\
    AND l.usuario_id = ue.usuario_id\
    AND ue.inventario_id = ?\
    AND l.password = ?\
    AND l.cpf = ?";
    let connection = mysql.createConnection(env.config_mysql)
    connection.query(sql, [inventario_id,pass,cpf], (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal);
        res.status(400).json({error:error.code})
        return;
      }
      if (results.length) {
        let newresults = results[0]
        newresults['login'] = 0
        res.json(newresults);
      }
      else {
        res.status(401).json(resp);
      }
      connection.end();
      console.log('GET /login');
    });
  })
  server.get('/inventario', (req, res) => {
    let inventario_id = 1;
    let sql = "\
    SELECT tipo_inventario, validade,\
    fabricacao, lote, itens_embalagem,\
    marca, fornecedor, ignorar_zero_esq,\
    ignorar_zero_direita\
    FROM inventario\
    WHERE id = ?";
    let connection = mysql.createConnection(env.config_mysql)
    connection.query(sql, [inventario_id], (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal);
        res.status(400).json({error:error.code})
        return;
      }
      res.json(results[0]);
      connection.end();
      console.log('GET /inventario');
    });
  })
  server.get('/enderecamento', (req, res) => {
    let user_id = req.query.usuario_id;
    let inventario_id = 1;
    let sql = "\
    SELECT ue.enderecamento_id, e.descricao\
    FROM usuario_enderecamento ue, enderecamento e\
    WHERE ue.inventario_id = ?\
    AND ue.usuario_id = ?\
    AND ue.enderecamento_id = e.id";
    let connection = mysql.createConnection(env.config_mysql)
    connection.query(sql, [inventario_id, user_id], (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal);
        res.status(400).json({error:error.code})
        return;
      }
      res.json(results);
      connection.end();
      console.log('GET /enderecamento');
    });
  })
  server.post('/coleta', (req, res) => {
    let coletas  = req.body;
    let values = [];

    for(var i=0; i< coletas.length; i++)
      values.push([
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
      ]);
    let sql = 'INSERT INTO coleta (usuario_id,\
    data,hora,enderecamento,cod_barra,\
    validade,fabricacao,lote,\
    itens_embalagem,marca,fornecedor) VALUES ?';
    let connection = mysql.createConnection(env.config_mysql)
    connection.query(sql, [values], (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal);
        res.status(400).json({error:error.code})
        return;
      }
      res.status(201).json({mensagem:'coleta criada!'});
      connection.end();
      console.log('POST /coleta');
    });
  })
  server.get('/', (req, res) => {
    // console.log(req.body)
    console.log("GET /")
    return res.send({message:'ok'})
  })
}
